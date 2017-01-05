module.exports = {
    fields: (sequelize)=> {
        return {
            v10: {type: sequelize.BOOLEAN, defaultValue: false},//第一题，点餐收银区
            v11: {type: sequelize.BOOLEAN, defaultValue: false},//第一题，大堂服务
            v12: {type: sequelize.BOOLEAN, defaultValue: false},//第一题，甜品站 kiosk
            v13: {type: sequelize.BOOLEAN, defaultValue: false},//第一题，麦咖啡 cafe
            v14: {type: sequelize.BOOLEAN, defaultValue: false},//第一题，厨房
            v15: {type: sequelize.BOOLEAN, defaultValue: false},//第一题，外卖员 mds

            v2: {type: sequelize.BOOLEAN, defaultValue: false},//第二题，其他经理

            v30: {type: sequelize.BOOLEAN, defaultValue: false},//第三题，服务态度
            v31: {type: sequelize.BOOLEAN, defaultValue: false},//第三题，洗手间
            v32: {type: sequelize.BOOLEAN, defaultValue: false},//第三题，服务速度
            v33: {type: sequelize.BOOLEAN, defaultValue: false},//第三题，麦咖啡 cafe
            v34: {type: sequelize.BOOLEAN, defaultValue: false},//第三题，产品品质
            v35: {type: sequelize.BOOLEAN, defaultValue: false},//第三题，麦乐送 mds
            v36: {type: sequelize.BOOLEAN, defaultValue: false},//第三题，产品准确
            v37: {type: sequelize.BOOLEAN, defaultValue: false},//第三题，得来速 dt
            v38: {type: sequelize.BOOLEAN, defaultValue: false},//第三题，大堂清洁
            v39: {type: sequelize.BOOLEAN, defaultValue: false},//第三题，其他
            v310: {type: sequelize.STRING},
            v4: {type: sequelize.INTEGER(1), defaultValue: 0},//第四题，打赏金额，选项有0 1 2 3
            v5: {type: sequelize.INTEGER(1), defaultValue: 0},//第五题，会推荐给朋友吗 0不会，10会
            openid: sequelize.STRING,//投票用户的微信openid
            ip: sequelize.STRING,//投票用户的ip
            province: sequelize.STRING,
            city: sequelize.STRING,
        };
    },
    config: (db)=> {
        return {
            defaultScope: {},
            scopes: {},
            hooks: {},
        };
    },
    associate: (db)=> {
        db.vote.belongsTo(db.store);
        db.vote.belongsTo(db.couponType);
        db.vote.hasMany(db.voteManager);
        db.vote.hasOne(db.coupon);
    },
};