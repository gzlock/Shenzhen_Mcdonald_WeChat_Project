const koa = require('koa');
const render = require('koa-ejs');
const path = require('path');
const Router = require('koa-router');
const session = require('koa-session-redis');
const routeUtil = require('./function/routeUtil')(path.join(__dirname, 'routers', './backend'));
const moment = require('moment');

const app = koa();
app.listen(process.env.PORT);

render(app, {
    root: path.join(__dirname, 'views', 'backend'),
    cache: false,
    debug: true
});

const router = new Router({prefix: '/data'});

let backendPath = path.join(__dirname, 'routers', './backend');
let routes = [
    'qrcode',
    'login',
    'index',
    'admin',
    'view',
    'editor',
];
try {
    for (let i in routes) {
        router.use(require(path.join(backendPath, routes[i])).routes());
    }
} catch (e) {
    console.log('路由错误', e);
}

app.proxy = true;
app.keys = ['mcd SZ'];
app
    .use(function*(next) {
        this.mysql = require('./sequelize');
        this.show = show;
        try {
            yield next;
            if (this.status != 200 && this.status != 302) this.throw(this.status);
        } catch (err) {
            // console.log('catch error', err);
            this.app.emit('error', err, this);
            // console.log('catch error', err.status, err.message);
            yield *error(this, err);
        }
    })
    .use(session({
        store: {host: 'redis', ttl: 30 * 24 * 3600},
        cookie: {maxAge: moment().add(5, 'days').toDate()}
    }))
    .use(require('koa-bodyparser')())
    .use(router.routes())
    .use(router.allowedMethods());

/**
 * 接收错误
 */
app.on('error', function (err, ctx) {
    if (err.status == 404) return console.log(ctx.request.url, 404);
    console.log(ctx.request.url, err.status, err);
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
        return yield this.render(file,
            Object.assign(
                {title: ''},
                data,
                {user: this.session.user},
                this.state
            ));
    }
    if (!file && !data) file = 'ok';
    this.status = file.status || status;
    if (file.constructor == String || file.constructor == Number)
        this.body = {message: file};
    else
        this.body = {data: file};
}

function *error(ctx, err) {
    let status = err.status || 500;
    let type = requestType(ctx);
    let message;
    if (status == 403)message = '没有权限执行这个操作';
    else if (status == 404)message = '无法找到需要的数据或页面';
    else message = err.message;
    if (type == 'html') {
        return yield ctx.render('error', {message: message, layout: false}, status);
    }
    ctx.status = status;
    ctx.body = {message: message};
}

function requestType(ctx) {
    return ctx.accepts('html', 'json');
}