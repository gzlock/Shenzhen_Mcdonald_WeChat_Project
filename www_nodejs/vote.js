const koa = require('koa');
const render = require('koa-ejs');
const path = require('path');
const session = require('koa-session-redis');
const routeUtil = require('./function/routeUtil')(path.join(__dirname, 'routers', 'vote'));
const moment = require('moment');
const Router = require('koa-router');
const redisConfig = require('./config')('redis');
const redis = require('redis').createClient(redisConfig);//redis 客户端

const app = koa();
app.listen(process.env.PORT | 80);


render(app, {
    root: path.join(__dirname, 'views', 'vote'),
    cache: false,
    debug: true
});

const router = new Router();
let vote = require('./routers/vote/index');
router.use('/vote', vote.routes(), vote.allowedMethods());
let coupon = require('./routers/vote/coupon');
router.use('/coupon', coupon.routes(), coupon.allowedMethods());

app.proxy = true;
app.keys = ['mcd SZ'];
app
    .use(function*(next) {
        this.mysql = require('./sequelize');
        this.show = show;
        try {
            yield next;
            // if (this.status != 200 && this.status != 302) this.throw(this.status);
        } catch (err) {
            // console.log('catch error', err);
            this.app.emit('error', err, this);
            // console.log('catch error', err.status, err.message);
            yield *error(this, err);
        }
    })
    .use(session({
        store: {host: 'redis', ttl: 3600},
        cookie: {maxAge: moment().add(5, 'days').toDate()}
    }))
    .use(require('koa-bodyparser')())
    .use(router.routes())
    .use(router.allowedMethods());

/**
 * 接收错误
 */
app.on('error', function (err, ctx) {
    if (err.status != 500) return;
    console.log(ctx.request.url, err.status, err.message);
});


/**
 *
 * @param {String|Object} file
 * @param data
 * @param status
 * @return {*}
 */
function *show(file, data, status = 200) {
    if (file && data) {
        this.status = data.status || status;
        return yield this.render(file, data);
    }
    if (!file && !data) file = 'ok';
    this.status = file.status || status;
    let type = requestType(this);
    if (file.constructor == Object)
        this.body = {data: file};
    else
        this.body = {message: file};
}

function *error(ctx, err) {
    ctx.status = err.status || 500;
    let type = requestType(ctx);
    if (type == 'html')
        return yield ctx.render('error', {layout: false, error: err.message});
    ctx.body = err.message;
}

function requestType(ctx) {
    return ctx.accepts('html', 'json');
}