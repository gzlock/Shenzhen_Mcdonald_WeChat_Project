const config = {
    weChat: {
        appID: 'appID',
        appSecret: 'appSecret',

        token: '123',
        encodingAESKey: 'encodingAESKey'
    },
    redis: {
        host: 'redis',
        port: 6379,
        key: {
            accessToken: 'accessToken',
            jsAPI: 'jsAPI',
            openid: 'openid',
        },
    },
    development: {
        sha1Key: 'sdggkfhdas',
        domain: 'sz.yingwin.cn',
        host: 'mysql',
        mysql: {
            host: 'mysql',
            username: 'MacDonald',
            password: 'LthGiUXlEnWTWWU7',
            database: 'MacDonald',
            dialect: 'mysql',
            dialectOptions: {
                charset: 'utf8mb4'
            },
            force: false,//强制清空数据
            logging: false,
            timezone: '+08:00',
        },
        data: {
            userGroup: [
                {name: '管理员'},
                {name: '主管'},
                {name: '经理'},
            ],
            user: [
                {username: '321', password: '123456', userGroupId: 1},
                {username: '123', password: '123456', userGroupId: 2},
            ],
            /*couponType: [{type: '6'}, {type: '7'},],
            store: [{name: '门店1', code4: '1000', code7: '1111111', couponTypeId: 1, kiosk: true, cafe: true}],
            manager: [{name: '经理1', code: 123, storeId: 1}],*/
        }
    },
    production: {
        sha1Key: 'sdggkfhdas',
        domain: 'sz.yingwin.cn',
        mysql: {
            host: 'mysql',
            username: 'MacDonald',
            password: 'LthGiUXlEnWTWWU7',
            database: 'MacDonald',
            dialect: 'mysql',
            dialectOptions: {
                charset: 'utf8mb4'
            },
            force: false,//生产环境不清空数据
            logging: false,
            timezone: '+08:00',
        },
        data: {
            userGroup: [
                {name: '管理员'},
                {name: '主管'},
                {name: '经理'},
            ],
            user: [
                {username: '321', password: '123456', userGroupId: 1},
                {username: '123', password: '123456', userGroupId: 2},
            ],
            couponType: [{type: '6'}, {type: '7'},],
        }
    },
};

module.exports = env=> {
    if (config.hasOwnProperty(env))return config[env];
    return config['development'];
};