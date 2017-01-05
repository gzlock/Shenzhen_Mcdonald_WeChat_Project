if (process.env.NODE_ENV != 'production') {
    console.log('不是生产环境，不请求微信Token');
    return;
}

const later = require('later');
const co = require('co');
const request = require('request');
const Redis = require('ioredis');
const moment = require('moment');

const redisConfig = require('./config')('redis');
const weChatConfig = require('./config')('weChat');

const minute = 5;
const sched = later.parse.recur().every(minute).minute();
const redis = new Redis(redisConfig);

co(get);
later.setInterval(()=> {
    console.log('请求token,时间', moment().format('HH:mm:ss'));
    co(get);
}, sched);

function *get() {
    let token = yield req();
    if (!token)return;
    yield redis.set(redisConfig.key.accessToken, token);
}

function req() {
    let url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${weChatConfig.appID}&secret=${weChatConfig.appSecret}`
    return new Promise(resolve=> {
        request(url, (err, res, body)=> {
            // console.log(body);
            var info = JSON.parse(body);
            let token = null;
            if (info.access_token)
                token = info.access_token;
            resolve(token);
        });
    });
}