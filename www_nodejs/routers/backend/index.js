const utils = require('../../function/utils');
const Router = require('koa-router');
const router = module.exports = Router();

router.use(function *(next) {
    if (this.session.user) return yield next;
    this.status = 403;
    if (utils.requestType(this) == 'html')
        return yield this.show('index/login', {title: '登录', layout: false});
    yield this.show('请登录');
});

router.use(function *(next) {
    if (!this.session.syncTime)
        this.session.syncTime = Date.now();
    else if (Date.now() - this.session.sync > 10000) {
        let user = yield this.mysql.user.findOne({where: {id: this.session.user.id}});
        if (!user)
            this.throw('你的账号已被删除', 403);
        this.session.user = user.toJSON();
        this.session.syncTime = Date.now();
    }
    yield next;
});

/**
 * 显示登录后的首页
 */
router.get('/', function *() {
    yield this.show('index/index', {title: '首页'});
});

router.get('/logout', function *() {
    delete this.session.user;
    this.redirect('/data');
});