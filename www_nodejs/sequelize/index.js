const path = require("path");
const Sequelize = require("sequelize");
const config = require(path.join(__dirname, '..', 'config.js'))(process.env.NODE_ENV)['mysql'];
const sequelize = new Sequelize(config.database, config.username, config.password, config);
const db = {sequelize: sequelize};

let temp = [];
let models = [
    'config',//配置
    'coupon',//优惠券
    'couponType',//优惠券类型
    'store',//门店
    'storeDO',//门店的DO
    'storeOM',//门店的OM
    'storeOC',//门店的OC
    'manager',//经理
    'vote',//投票数据
    'voteManager',//投票数据
    'userGroup',//用户组
    'user',//用户
    'dayStoreVote',//门店数据统计
    'dayManagerVote',//经理数据统计
];
models
    .forEach(function (file) {
        // console.log('mysql table:', file);
        let model = require(path.join(__dirname, file));
        temp.push(model);
        let fields = model.fields(Sequelize);
        let config;
        if (model.config) {
            if (model.config.constructor == Function)
                config = model.config(sequelize.models);
            else
                config = model.config;
        }
        sequelize.define(file, fields, config);
    });

temp.forEach(model=> {
    model.associate && model.associate(sequelize.models);
    model.scopes && model.scopes(sequelize.models);
});

temp = models = null;

for (let i in sequelize.models) {
    let model = sequelize.models[i];
    db[model.name] = model;
}


module.exports = db;