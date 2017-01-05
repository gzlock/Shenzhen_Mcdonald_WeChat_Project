const WeChatApi = require('wechat-api');
const Router = require('koa-router');
const WeChatOauth = require('wechat-oauth');
const redisConfig = require('../../../config')('redis');
const weChatConfig = require('../../../config')('weChat');
const redis = require('redis').createClient(redisConfig);//redis 客户端

let router = module.exports = Router();

let oauth = new WeChatOauth(
    weChatConfig.appID,
    weChatConfig.appSecret,
    (openid, cb)=> {//读取
        redis.get(redisConfig.key.openid + ':' + openid, (err, token)=> {
            // console.log('get access token', err, token);
            if (err) return cb(err);
            cb(null, JSON.parse(token));
        });
    },
    (openid, token, cb)=> {//保存
        redis.set(redisConfig.key.openid + ':' + openid, JSON.stringify(token), cb);
    });

let wechat = new WeChatApi(
    weChatConfig.appID,
    weChatConfig.appSecret,
    cb=> {//读取
        redis.get(redisConfig.key.accessToken, (err, token)=> {
            // console.log('get access token', err, token);
            if (err) return cb(err);
            cb(null, {accessToken: token, expireTime: Date.now() + 60000});
        });
    },
    (token, cb)=> {//保存
        console.log('set access token', token);
        /*token.expireTime -= 600 * 100;
        redis.set(redisConfig.key.accessToken, JSON.stringify(token), cb);*/
        cb();
    });

wechat.registerTicketHandle((type, cb)=> {
    // console.log('get ticket token', type);
    redis.get(redisConfig.key + type, (err, token)=> {
        if (err) return cb(err);
        cb(null, JSON.parse(token));
    });
}, (type, token, cb)=> {
    // console.log('set ticket token', type, token);
    redis.set(redisConfig.key.jsAPI + type, JSON.stringify(token), cb);
});
router.use(function *(next) {
    this.wechat = wechat;
    this.oauth = oauth;
    yield next;
});
