const fs = require('fs');
const path = require('path');
const Router = require('koa-router');

module.exports = (dir)=> {
    return new Load(dir);
};

class Load {
    constructor(dir) {
        this.dir = dir;
    }

    routes(dir) {
        let routePath = path.join(this.dir, dir);
        let router = new Router();
        fs
            .readdirSync(routePath)
            .filter(function (file) {
                return (file.indexOf(".") !== 0);
            })
            .forEach(function (file) {
                try {
                    router.use(require(path.join(routePath, file)).routes());
                }
                catch (e) {
                    console.log('route load error', e);
                }
            });
        return router.routes();
    }
}