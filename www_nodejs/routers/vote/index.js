const Router = require('koa-router');
const utils = require('../../function/utils');
const Redis = require('ioredis');
const moment = require('moment');
const router = module.exports = new Router();
const redisConfig = require('../../config')('redis');
const weChat = require('../../config')('weChat');
const config = require('../../config')(process.env.NODE_ENV);
const path = require('path');
const lodash = require('lodash');
const ipip = require('ipip')(path.join(__dirname, '../../17monipdb.dat'));

const env = process.env.NODE_ENV || 'dev';
const redis = new Redis(redisConfig);

console.log('env', env);

if (env != 'dev') {
//生成wechat-api
    router.use(require('./wechat-api').routes());
}

//判断
router.use('/:code7', function *(next) {
    if (env == 'dev')
        this.session.openid = '开发调试';

    let today = 'Day_' + moment().utcOffset('+08:00').format('DD');

    let voteTimes = yield redis.hget(today, this.session.openid);
    if (voteTimes >= 2) {
        // console.log(this.session.openid);
        this.throw('已经超过今天投票次数的限制', 403);
    }
    this.state.voteTimes = !!voteTimes ? 1 : 0;

    let store = yield this.mysql.store.findOne({where: {code7: this.params.code7, online: 1}});
    if (!store)
        this.throw('无法找到查看的门店', 403);
    this.state.store = store;

    //有openid,执行下一步
    if (this.session.openid)
        return yield next;

    //没有openid,如果是get请求显示投票页面，则跑逻辑
    if (this.method.toLowerCase() == 'get') {
        if (this.query && this.query.code) {//存在code参数
            let token = yield getOauth(this);
            // console.log(token);
            if (token && token.data && token.data.openid) {
                this.session.openid = token.data.openid;
                return yield next;
            }
            console.log('与微信服务器通讯失败 1');
            this.throw('与微信服务器通讯失败', 404);
        } else {//不存在code参数，需要跳转到微信网址获取
            let url = this.oauth.getAuthorizeURL(utils.configUrl(this), 'vote', 'snsapi_base');
            return this.redirect(url);
        }
    } else {//没有openid提交投票，则不接受
        this.throw('无效的投票数据');
    }
});

//显示投票页面
router.get('/:code7', function *() {
    if (env == 'dev') {
        this.state.weChatConfig = '{}';
    } else {
        try {
            this.state.weChatConfig = JSON.stringify(yield getJsConfig(this));
            // console.log('微信网页端 config', this.state.config);
        } catch (e) {
            console.log('与微信服务器通讯失败 2');
            this.throw('与微信服务器通讯失败', 404);
        }
    }
    let vote = {
        page3: page3(this.state.store),
        page4: yield page4(this.state.store),
        page5: page5(this.state.store),
    };

    utils.getDayStoreVote(this.mysql, {storeId: this.state.store.id}, {views: 1}, vote=> {
        // console.log('views+1', this.state.store.id, vote.isNew);
        if (vote.isNew)return;
        vote.increment('views');
    });

    for (let i in vote) {
        vote[i] = JSON.stringify(vote[i]);
    }
    yield this.show('index', {vote});
});

//处理投票数据
router.post('/:code7', function *() {
    if (this.request.body.v310 && this.request.body.v310.length > 255)
        this.throw(403);

    //门店的优惠券类型
    let couponType = yield this.state.store.getCouponType();

    //格式化投票数据
    let voteData = Object.assign({
        couponTypeId: couponType.id,
        storeId: this.state.store.id,
        ip: this.ip,
        openid: this.session.openid,
    }, voteDataInit(this.state.store, this.request.body));
    let ip = ipip(this.ip);
    voteData.province = ip.province;
    voteData.city = ip.city;


    let vote = yield this.mysql.vote.create(voteData);

    yield voteManagers(this, vote, this.request.body);

    let coupon = yield this.mysql.coupon.create({
        storeId: this.state.store.id,
        voteId: vote.id,
        couponTypeId: couponType.id
    });

    this.state.voteTimes++;

    let today = 'Day_' + moment().utcOffset('+08:00').format('DD');
    let todayExists = yield redis.exists(today);
    yield redis.hset(today, this.session.openid, this.state.voteTimes);
    if (!todayExists) {
        let time = moment().utcOffset('+08:00').add(1, 'day').startOf('day').unix();
        redis.expireat(today, time);
    }

    yield this.show({type: couponType.type, id: coupon.cid});
});

function getOauth(ctx) {
    return new Promise((resolve, reject)=> {
        ctx.oauth.getAccessToken(ctx.query.code, function (err, token) {
            // console.log('getOauth', err, token);
            if (err) return reject(err);
            resolve(token);
        });
    });
}

function getJsConfig(ctx) {
    let params = {
        debug: false,
        jsApiList: ['onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ', 'onMenuShareWeibo', 'onMenuShareQZone'],
        url: utils.configUrl(ctx),
    };
    return new Promise((resolve, reject)=> {
        ctx.wechat.getJsConfig(params, (err, data)=> {
            // console.log('JsConfig', err, data);
            if (err)return reject(err);
            resolve(data);
        });
    });
}

function page3(store) {
    let data = {
        v10: {field: 'v10', text: '点餐收银区员工', checked: false},
        v11: {field: 'v11', text: '大堂服务员工', checked: false},
        v12: {field: 'v12', text: '甜品站员工', checked: false},
        v13: {field: 'v13', text: '麦咖啡员工', checked: false},
        v14: {field: 'v14', text: '厨房员工', checked: false},
        v15: {field: 'v15', text: '外卖员', checked: false},
    };
    if (!store.kiosk) delete data['v12'];
    if (!store.cafe)  delete data['v13'];
    if (!store.mds)  delete data['v15'];
    return data;
}

function *page4(store) {
    let managers = yield store.getManagers({where: {work: true}, attributes: ['name', 'code']});
    let data = [];

    for (let i in managers) {
        data.push({code: managers[i].code, text: managers[i].name, checked: false});
    }
    data.push({field: 'v2', text: '其他值班经理', checked: false});
    return data;
}

function page5(store) {
    let data = {
        v30: {field: 'v30', text: '服务态度', checked: false},
        v31: {field: 'v31', text: '洗手间', checked: false},
        v32: {field: 'v32', text: '服务速度', checked: false},
        v33: {field: 'v33', text: '麦咖啡', checked: false},
        v34: {field: 'v34', text: '产品品质', checked: false},
        v35: {field: 'v35', text: '麦乐送', checked: false},
        v36: {field: 'v36', text: '产品准确', checked: false},
        v37: {field: 'v37', text: '得来速', checked: false},
        v38: {field: 'v38', text: '大堂清洁', checked: false},
        v39: {field: 'v39', text: '其他', checked: false},
    };
    if (!store.cafe) delete data['v33'];
    if (!store.mds) delete data['v35'];
    if (!store.dt) delete data['v37'];
    return data;
}

const money = [0, 1, 2, 3];
function voteDataInit(store, data) {
    let vote = {v2: false, v310: data[2].v310, v5: data[4].value};
    let needFor = [data[0], data[2]];
    for (let i in needFor) {
        let f = needFor[i];
        for (let i in f) {
            let d = f[i];
            if (d && d.field)
                vote[d.field] = d.checked;
        }
    }
    let moneyIndex = 0;
    for (let i in data[3]) {
        if (data[3][i].checked) {
            moneyIndex = i;
            break;
        }
    }
    vote.v4 = !!money[moneyIndex] ? money[moneyIndex] : money[0];
    for (let i in data[1]) {
        let d = data[1][i];
        if (d.field == 'v2' && d.checked) {
            vote.v2 = true;
            break;
        }
    }
    if (!store.kiosk)vote.v12 = false;
    if (!store.kiosk)vote.v12 = false;
    if (lodash.isEmpty(vote.v310))
        vote.v310 = null;
    return vote;
}
/**
 * 从数据中创建经理的投票
 * @param ctx
 * @param vote
 * @param data
 */
function *voteManagers(ctx, vote, data) {
    data = data[1];
    let codes = [];
    for (let i in data) {
        if (data[i].checked && data[i].code >= 0)
            codes.push(data[i].code);
    }
    let managers = yield ctx.state.store.getManagers({where: {work: true, code: {$in: codes}}});

    // console.log('vote manager length', managers.length);
    let yoo = [];
    for (let i in managers) {
        let m = managers[i];
        yoo.push({managerId: m.id, storeId: ctx.state.store.id, voteId: vote.id});
    }
    ctx.mysql.voteManager.bulkCreate(yoo);
}
