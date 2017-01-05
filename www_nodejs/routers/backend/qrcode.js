const Router = require('koa-router');
const router = module.exports = Router({prefix: '/qrcode'});
const utils = require('../../function/utils');

/**
 * 显示二维码页面
 */
router.get('/', function *() {
    yield this.show('qrcode/index', {layout: false});
});

/**
 * 查询门店
 */
router.get('/:query', function *() {
    let query = Number(this.params.query);
    if (!(query > 0)) this.throw(405);
    let store = yield this.mysql.store.findOne({
        where: {
            $or: [
                {code4: query},
                {code7: query},
            ]
        }
    });
    if (!store) this.throw(404);
    yield this.show({name: store.name, url: utils.voteUrl(store.code7)});
});