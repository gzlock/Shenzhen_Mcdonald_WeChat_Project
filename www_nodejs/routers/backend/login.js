const utils = require('../../function/utils');
const Router = require('koa-router');
const router = module.exports = Router({prefix: '/login'});

router.post('/', function *() {
    let user = yield this.mysql.user.findOne({
        where: {
            username: this.request.body.a,
            password: utils.sha1(this.request.body.b)
        }
    });
    if (!user) this.throw('登录失败，账号或密码错误');
    this.session.user = user.toJSON();
    this.session.syncTime = Date.now();
    yield this.show();
});