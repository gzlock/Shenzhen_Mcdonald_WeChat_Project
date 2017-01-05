const Router = require('koa-router');
const moment = require('moment');
const lodash = require('lodash');
const voteDataUtils = require('./voteDataUtils');
const utils = require('../../function/utils');
const router = module.exports = Router({prefix: '/view'});

router.use(function *(next) {
    let user = this.session.user;
    let level = user.userGroup.id;
    let dos = [], oms = [], ocs = [], stores = [];
    let storesWhere = {
        raw: true,
        attributes: ['id', 'name', 'storeDOId', 'storeOMId', 'storeOCId']
    };
    let raw = {raw: true};
    switch (level) {
        case 1://超级管理员
        case 2://管理员
            dos = yield this.mysql.storeDO.findAll(raw);
            oms = yield this.mysql.storeOM.findAll(raw);
            ocs = yield this.mysql.storeOC.findAll(raw);
            stores = yield this.mysql.store.findAll(storesWhere);
            break;
        case 3://DO
            dos = yield this.mysql.storeDO.findAll(raw);
            oms = yield this.mysql.storeOM.findAll(raw);
            ocs = yield this.mysql.storeOC.findAll(raw);
            stores = yield this.mysql.store.findAll(storesWhere);
            break;
        case 4://OM
            dos = yield this.mysql.storeDO.findOne({include: [{model: this.mysql.storeOM, where: {id: user.value}}]});
            oms = yield dos.getStoreOMs(raw);
            ocs = yield dos.getStoreOCs(raw);
            stores = yield dos.getStores(storesWhere);
            dos = [dos.toJSON()];
            break;
        case 5://OC
            oms = yield this.mysql.storeOM.findOne({include: [{model: this.mysql.storeOC, where: {id: user.value}}]});
            ocs = yield oms.getStoreOCs(raw);
            stores = yield oms.getStores(storesWhere);
            oms = [oms.toJSON()];
            break;
        case 6://门店
            ocs = yield this.mysql.storeOC.findOne({where: user.value});
            stores = yield ocs.getStores(storesWhere);
            ocs = [ocs.toJSON()];
    }
    if (!stores[0])
        this.throw('没有门店数据', 404);
    dos.forEach((item, i)=> {
        item.selected = true;
    });
    oms.forEach(item=> {
        item.selected = true;
    });
    ocs.forEach(item=> {
        item.selected = true;
    });
    stores.forEach(item=> {
        item.selected = true;
    });
    this.state.dos = dos;
    this.state.oms = oms;
    this.state.ocs = ocs;
    this.state.stores = stores;
    this.state.storeId = lodash.map(stores, 'id');
    yield next;
});

/**
 * 显示页面
 */
router.get('/', function *() {
    let user = this.session.user;
    let level = user.userGroup.id;
    let title;
    switch (level) {
        case 1:
        case 2:
            title = '管理员';
            break;
        case 3:
            title = 'DO - ' + this.state.dos[0].name;
            break;
        case 4:
            title = 'OM - ' + this.state.oms[0].name;
            break;
        case 5:
            title = 'OC - ' + this.state.ocs[0].name;
            break;
        case 6:
            title = '门店 - ' + this.state.stores[0].name;
            break;
    }
    yield this.show('view/index', {title});
});

/**
 * 读取门店数据
 */
router.post('/data/:start/:end', function *() {
    let storesId = lodash.intersection(this.state.storeId, this.request.body);
    let stores = yield voteDataUtils.find(this.mysql, storesId,
        voteDataUtils.timeRange(this.params.start, this.params.end));
    let result = {
        v10: 0, v11: 0, v12: 0, v13: 0, v14: 0, v15: 0,
        v2: 0,
        v30: 0, v31: 0, v32: 0, v33: 0, v34: 0, v35: 0, v36: 0, v37: 0, v38: 0, v39: 0,
        v4Total: 0, v40: 0, v41: 0, v42: 0, v43: 0,
        v5Total: 0, v5Calc: 0, v50: 0, v51: 0, v52: 0, v53: 0, v54: 0, v55: 0, v56: 0, v57: 0, v58: 0, v59: 0, v510: 0,
        coupons: 0, couponsUsed: 0, views: 0, votes: 0
    }, managers = [];
    let v506 = 0, v5910 = 0;
    for (let i in stores) {
        let store = stores[i];
        if (store.managers && store.managers) {
            for (let i in store.managers) {
                managers.push(store.managers[i]);
            }
        }
        // delete d.managers;
        for (let j in result) {
            result[j] += store[j] | 0;
        }
        v506 += store.v50 + store.v51 + store.v52 + store.v53 + store.v54 + store.v55 + store.v56;
        v5910 += store.v59 + store.v510;
    }
    result.v5Calc = ((voteDataUtils.divide(v5910, result.votes) - voteDataUtils.divide(v506, result.votes)) * 100).toFixed(2) + '%';
    if (managers.length > 10) {
        let other = lodash.orderBy(managers, ['like'], ['desc']);
        managers = other.splice(0, 10);
        result.managers = managers;
    } else
        result.managers = managers;
    this.body = result;
});

/**
 * 下载门店excel
 */
router.post('/xlsx/:start/:end', function *() {
    let stores = [];
    try {
        stores = JSON.parse(this.request.body.stores);
    } catch (e) {
        this.throw('没有指定门店，无法提供Excel表格数据 1', 404);
    }
    let storesId = lodash.intersection(stores, this.state.storeId);
    if (storesId.length == 0)
        this.throw('没有指定门店，无法提供Excel表格数据 2', 404);
    let timeRange = voteDataUtils.timeRange(this.params.start, this.params.end);
    let data = yield voteDataUtils.find(this.mysql, storesId, timeRange, true);
    voteDataUtils.buildXLSX(this, '', timeRange, data);
});