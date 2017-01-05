const Router = require('koa-router');
const lodash = require('lodash');
const config = require('../../config');
const utils = require('../../function/utils');

let router = module.exports = Router({prefix: '/admin'});

/**
 * 过滤操作权限
 */
router.use(function *(next) {
    if (this.session.user && this.session.user.userGroup.id == 1) {
        return yield next;
    }
    this.throw(403);
});

/**
 * 批量录入门店
 */
router.get('/bulkCreate', function *() {
    yield this.show('admin/bulkCreate', {title: '批量录入门店'});
});

/**
 * 批量门店 接收数据
 */
router.post('/bulkCreate', function *() {
    let forum = this.request.body;
    let DO = {};
    let OM = {};
    let OC = {};

    for (let i in forum) {
        let data = forum[i];
        let temp;

        let _do = data.DO.trim();
        let _om = data.OM.trim();
        let _oc = data.OC.trim();
        let storeName = data.name.trim();
        let code4 = parseInt(data.code4);
        let code7 = parseInt(data.code7);
        if (!DO[_do]) {
            temp = yield this.mysql.storeDO.findOrCreate({
                where: {name: _do},
                defaults: {name: _do}
            });
            DO[_do] = temp[0];
        }

        if (!OM[_om]) {
            temp = yield this.mysql.storeOM.findOrCreate({
                where: {name: _om},
                defaults: {name: _om, storeDOId: DO[_do].id}
            });
            OM[_om] = temp[0];
        }

        if (!OC[_oc]) {
            temp = yield this.mysql.storeOC.findOrCreate({
                where: {name: _oc},
                defaults: {name: _oc, storeDOId: DO[_do].id, storeOMId: OM[_om].id}
            });
            OC[_oc] = temp[0];
        }

        let store = {
            name: storeName,
            code4: code4,
            code7: code7,
            kiosk: false,
            cafe: false,
            dt: false,
            mds: false,
            storeDOId: DO[_do].id,
            storeOMId: OM[_om].id,
            storeOCId: OC[_oc].id,
            couponTypeId: 1,
        };

        if (data.be) {
            let be = data.be.toLowerCase();//excel表的门店配置字段，内容举例：Kiosk&MDS&McCafe&24h&DPS&SOK
            store.kiosk = be.indexOf('kiosk') != -1;//甜品站
            store.cafe = be.indexOf('cafe') != -1;//麦咖啡
            store.dt = be.indexOf('dt') != -1;//得来速
            store.mds = be.indexOf('mds') != -1;//麦乐送
        }


        let store_ = yield this.mysql.store.findOne({where: {code4: store.code4, code7: store.code7}});
        if (store_) {
            store_.set(store).save();
        } else {
            yield this.mysql.store.create(store);
        }
    }
    yield this.show();
});


/**
 * 显示批量录入经理页面
 */
router.get('/managerBulkCreate', function *() {
    yield this.show('admin/managerBulkCreate', {title: '批量录入经理'});
});

/**
 *批量录入经理
 */
router.post('/managerBulkCreate', function *() {
    let data = this.request.body;
    let stores = {};
    for (let i in data) {
        let code7 = data[i].code7;
        let store = stores[code7];
        if (!store)
            stores[code7] = store = yield this.mysql.store.findOne({where: {code7}});
        yield this.mysql.manager.findOrCreate({
            where: {code: data[i].code},
            defaults: {name: data[i].name, code: data[i].code, storeId: store.id,}
        });
    }
    yield this.show();
});

/**
 * 修改门店信息
 */
router.get('/', function *() {

});
router.post('/store/:id', function *() {
    let store = yield this.mysql.store.findOne({where: {id: this.params.id}});
    if (!store)
        this.throw(404);
    let data = this.request.body;
    let setting = {kiosk: false, cafe: false, dt: false, mds: false};
    for (let i in setting) {
        setting[i] = !!data[i];
    }
    setting.name = data.name;
    setting.couponTypeId = data.couponTypeId == 1 ? 1 : 2;
    yield store.set(setting).save();
    yield this.show();
});

/**
 * 账号
 */
router.get('/user', function *() {
    let users = yield this.mysql.user.findAll({order: 'id asc'});
    let userGroups = yield this.mysql.userGroup.findAll({order: 'id asc'});

    yield this.show('admin/user', {title: '管理账号', users, userGroups});
});
router.post('/user', function *() {
    let data = this.request.body;
    if (!data.userGroupId)
        this.throw('缺少用户组');
    let userData = {
        username: data.a.trim(),
        userGroupId: data.userGroupId,
        value: !data.value ? 0 : data.value
    };

    if (data.id) {
        if (data.b)
            userData.password = utils.sha1(data.b.trim(), config.sha1Key);
        let user = yield this.mysql.user.findOne({where: {id: data.id}});

        if (user.id != this.session.user.id) {
            if (user.userGroup.id == this.session.user.userGroup.id)
                this.throw('不能管理同级别账号');
        }
        yield user.set(userData).save();
        yield this.show();
    } else {
        userData.password = data.b.trim();
        if (!userData.password)
            this.throw('缺少密码');
        yield this.mysql.user.create(userData);
    }
    yield this.show();
});
router.del('/user/:id', function *() {
    if (this.params.id == this.session.user.id)
        this.throw('不能删除自己');
    let user = yield this.mysql.user.findOne({where: {id: this.params.id}});
    if (user.userGroup.id == this.session.user.userGroup.id)
        this.throw('不能删除同级别账号');
    yield user.destroy();
    yield this.show();
});