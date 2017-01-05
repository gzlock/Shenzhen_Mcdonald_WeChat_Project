const Router = require('koa-router');
const moment = require('moment');
const voteDataUtils = require('./voteDataUtils');
const userHelper = require('./userHelper');
const utils = require('../../function/utils');
const router = module.exports = Router({prefix: '/store'});

/**
 * 显示搜索门店页面
 */
router.get('/', function *() {
    let level = yield userHelper.get(this);
    if (level === true)
        yield this.show('store/index', {title: '搜索门店'});
    else if (level)
        return this.redirect('/data/store/view/' + level.code7);
    this.throw(404);
});

/**
 * 搜索门店
 */
router.get('/search/:text', function *() {
    let search = this.params.text;
    let stores = yield this.mysql.store.findAll({
        limit: 10,
        where: {
            $or: [
                {name: {$like: `%${search}%`}},
                {code4: {$like: `%${search}%`}},
                {code7: {$like: `%${search}%`}},
            ]
        }
    });
    yield this.show(stores);
});

/**
 * 检测是否有门店
 */
router.use('/:action/:code', function *(next) {
    if (this.params.action == 'search') return yield next;
    let store = yield this.mysql.store.findOne({
        where: {code7: this.params.code},
        include: [
            {model: this.mysql.storeDO},
            {model: this.mysql.storeOM},
            {model: this.mysql.storeOC},
        ]
    });
    if (!store) this.throw('没有这个门店', 404);
    this.state.store = store;
    yield next;
});

/**
 * 门店浏览页面
 */
router.get('/view/:code', function *() {
    yield this.show('store/store', {title: '门店 - ' + this.state.store.name});
});

/**
 * 接收门店数据
 */
router.post('/view/:code', function *() {
    if (this.session.user.userGroup.id >= 6)
        this.throw(403);
    /*let couponTypeId = Number(this.request.body.couponType) + 1;
     yield this.state.store.set({couponTypeId: couponTypeId}).save();*/
    let setting = {kiosk: false, cafe: false, dt: false, mds: false};
    for (let i in setting) {
        setting[i] = !!this.request.body[i];
    }
    setting.name = this.request.body.name;
    setting.couponTypeId = this.request.body.couponTypeId == 1 ? 1 : 2;
    yield this.state.store.set(setting).save();
    yield this.show();
});

/**
 * 读取门店数据
 */
router.get('/data/:code/:start/:end', function *() {
    this.body = yield voteDataUtils.find(this.mysql, [this.state.store.id],
        voteDataUtils.timeRange(this.params.start, this.params.end));
});
router.post('/data/:start/:end', function *() {
    this.body = yield voteDataUtils.find(this.mysql, this.request.body,
        voteDataUtils.timeRange(this.params.start, this.params.end));
});

/**
 * 下载门店的xlsx
 */
router.get('/xlsx/:code/:start/:end', function *() {
    let timeRange = voteDataUtils.timeRange(this.params.start, this.params.end);
    let data = yield voteDataUtils.find(this.mysql, [this.state.store.id], timeRange);
    voteDataUtils.buildXLSX(this, this.state.store.name, timeRange, data);
});
router.post('/xlsx/:start/:end', function *() {
    let timeRange = voteDataUtils.timeRange(this.params.start, this.params.end);
    let data = yield voteDataUtils.find(this.mysql, this.request.body, timeRange);
    voteDataUtils.buildXLSX(this, this.state.store.name, timeRange, data);
});

