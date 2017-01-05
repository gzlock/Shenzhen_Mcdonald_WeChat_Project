const utils = require('../function/utils');
module.exports = {
    fields: (sequelize)=> {
        return {
            name: {type: sequelize.STRING, allowNull: false},
            code4: {type: sequelize.INTEGER, allowNull: false, unique: 'code4'},//四位编号
            code7: {type: sequelize.INTEGER, allowNull: false, unique: 'code7'},//七位编号
            kiosk: {type: sequelize.BOOLEAN, defaultValue: false},//甜品站
            mds: {type: sequelize.BOOLEAN, defaultValue: false},//麦乐送
            cafe: {type: sequelize.BOOLEAN, defaultValue: false},//麦咖啡
            dt: {type: sequelize.BOOLEAN, defaultValue: false},//得来速
            online: {type: sequelize.BOOLEAN, defaultValue: true},
        };
    },
    config: (db)=> {
        return {
            timestamps: false,
            defaultScope: {},
            scopes: {
                a: {
                    include: [
                        {model: db.shopDO},
                        {model: db.shopOC},
                        {model: db.shopOM},
                    ]
                },
            },
            hooks: {},
        };
    },
    associate: (db)=> {
        db.store.belongsTo(db.storeDO);
        db.store.belongsTo(db.storeOC);
        db.store.belongsTo(db.storeOM);
        db.store.belongsTo(db.couponType);
        db.store.belongsToMany(db.user, {as: 'user', through: 'userShopMapping', unique: true});
        db.store.hasMany(db.vote);
        db.store.hasMany(db.coupon);
        db.store.hasMany(db.manager);
    },
};