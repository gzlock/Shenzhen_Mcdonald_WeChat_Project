/**
 * 门店，经理 编辑器
 */
const Router = require('koa-router');
const moment = require('moment');
const lodash = require('lodash');
const utils = require('../../function/utils');
const router = module.exports = Router({prefix: '/editor'});


router.use(function *(next) {
    if (this.session.user.userGroupId > 2)
        this.throw(403);
    yield next;
});


router.get('/', function *() {
    let where = {raw: true};
    let dos = yield this.mysql.storeDO.findAll(where);
    let oms = yield this.mysql.storeOM.findAll(where);
    let ocs = yield this.mysql.storeOC.findAll(where);
    yield this.show('editor/index', {title: '编辑器', dos, oms, ocs});
});

/**
 * 搜索
 */
router.get('/search/:type/:text', function *() {
    let type = {store: 'store', manager: 'manager', do: 'storeDO', om: 'storeOM', oc: 'storeOC'};
    type = type[this.params.type];
    if (!type)
        this.throw(404);
    let search = this.params.text;
    let where;
    switch (type) {
        case 'store':
            where = {
                where: {
                    $or: [
                        {name: {$like: `%${search}%`}},
                        {code4: {$like: `%${search}%`}},
                        {code7: {$like: `%${search}%`}},
                    ]
                },
            };
            break;
        case 'manager':
            where = {where: {$or: [{name: {$like: `%${search}%`}}, {code: {$like: `%${search}%`}},]}};
            break;
        case 'storeDO':
        case 'storeOM':
        case 'storeOC':
            where = {where: {$or: [{name: {$like: `%${search}%`}}]}};
    }
    Object.assign(where, {limit: 10});
    yield this.show(yield this.mysql[type].findAll(where));
});

/**
 * 获取门店列表
 */
router.get('/list/:type', function *() {
    let type = {store: 'store', manager: 'manager', do: 'storeDO', om: 'storeOM', oc: 'storeOC'};
    type = type[this.params.type];
    if (!type)
        this.throw(404);
    let where = {raw: true};
    let items = yield this.mysql[type].findAll(where);
    if (type == 'store')
        items.forEach((item, i)=> {
            items[i] = {name: item.name + ' ' + item.code7, id: item.id};
        });
    this.body = items;
});


/**
 * 接收编辑数据
 */
router.post('/save/:type', function *() {
    let type = {store: 'store', manager: 'manager', do: 'storeDO', om: 'storeOM', oc: 'storeOC'};
    type = type[this.params.type];
    if (!type)
        this.throw(404);
    if (!this.request.body.name)
        this.throw('缺少名称');
    switch (type) {
        case 'store':
            yield saveStore(this);
            break;
        case 'manager':
            yield saveManager(this);
            break;
        case 'storeDO':
        case 'storeOM':
        case 'storeOC':
            yield saveDoOmOc(this, type);
            break;
    }
});

/**
 * 保存或创建门店
 * @param ctx
 */
function *saveStore(ctx) {
    let setting = {kiosk: false, cafe: false, dt: false, mds: false};
    for (let i in setting) {
        setting[i] = !!ctx.request.body[i];
    }
    let value = {
        name: null,
        code7: null,
        code4: null,
        storeDOId: 0,
        storeOMId: 0,
        storeOCId: 0,
        couponTypeId: 0,
        online: 1
    };
    for (let i in value) {
        value[i] = ctx.request.body[i];
    }
    Object.assign(setting, value);
    let store;
    if (ctx.request.body.id)
        store = ctx.mysql.store.build({id: ctx.request.body.id}, {isNewRecord: false});
    else
        store = ctx.mysql.store.build();
    yield ctx.show(yield store.set(setting).save());
}

function *saveManager(ctx) {
    let data = ctx.request.body;
    if (!data.name)
        ctx.throw('缺少经理名称');
    if (!data.code)
        ctx.throw('缺少经理工号');
    let manager;
    if (data.id)
        manager = ctx.mysql.manager.build({id: data.id}, {isNewRecord: false});
    else
        manager = ctx.mysql.manager.build();
    manager = yield manager.set(data).save();
    yield ctx.show(manager);
}

function *saveDoOmOc(ctx, type) {
    let data = ctx.request.body;
    switch (type) {
        case 'storeOC':
            if (data.hasOwnProperty('storeDOId'))
                ctx.throw('请选择上级DO');
            if (data.hasOwnProperty('storeOMId'))
                ctx.throw('请选择上级OM');
            break;
        case 'storeOM':
            if (data.hasOwnProperty('storeOMId'))
                ctx.throw('请选择上级OM');
    }
    let target;
    if (data.id)
        target = ctx.mysql[type].build({id: data.id}, {isNewRecord: false});
    else
        target = ctx.mysql[type].build();
    yield target.set(data).save();
    yield ctx.show();
}