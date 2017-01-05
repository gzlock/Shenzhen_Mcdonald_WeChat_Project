module.exports = {
    fields: (sequelize)=> {
        return {
            v10: {type: sequelize.INTEGER, defaultValue: 0},//第一题，点餐收银区
            v11: {type: sequelize.INTEGER, defaultValue: 0},//第一题，大堂服务
            v12: {type: sequelize.INTEGER, defaultValue: 0},//第一题，甜品站 kiosk
            v13: {type: sequelize.INTEGER, defaultValue: 0},//第一题，麦咖啡 cafe
            v14: {type: sequelize.INTEGER, defaultValue: 0},//第一题，厨房
            v15: {type: sequelize.INTEGER, defaultValue: 0},//第一题，外卖员 mds

            v2: {type: sequelize.INTEGER, defaultValue: 0},//第二题，其他经理

            v30: {type: sequelize.INTEGER, defaultValue: 0},//第三题，服务态度
            v31: {type: sequelize.INTEGER, defaultValue: 0},//第三题，洗手间
            v32: {type: sequelize.INTEGER, defaultValue: 0},//第三题，服务速度
            v33: {type: sequelize.INTEGER, defaultValue: 0},//第三题，麦咖啡 cafe
            v34: {type: sequelize.INTEGER, defaultValue: 0},//第三题，产品品质
            v35: {type: sequelize.INTEGER, defaultValue: 0},//第三题，麦乐送 mds
            v36: {type: sequelize.INTEGER, defaultValue: 0},//第三题，产品准确
            v37: {type: sequelize.INTEGER, defaultValue: 0},//第三题，得来速 dt
            v38: {type: sequelize.INTEGER, defaultValue: 0},//第三题，大堂清洁
            v39: {type: sequelize.INTEGER, defaultValue: 0},//第三题，其他
            v4Total: {type: sequelize.INTEGER, defaultValue: 0},//第四题，总的打赏金额
            v40: {type: sequelize.INTEGER, defaultValue: 0},//第四题，投0的次数
            v41: {type: sequelize.INTEGER, defaultValue: 0},//第四题，投1的次数
            v42: {type: sequelize.INTEGER, defaultValue: 0},//第四题，投2的次数
            v43: {type: sequelize.INTEGER, defaultValue: 0},//第四题，投3的次数
            v5Total: {type: sequelize.INTEGER, defaultValue: 0},//第五题，总得分
            v50: {type: sequelize.INTEGER, defaultValue: 0},//第五题，0
            v51: {type: sequelize.INTEGER, defaultValue: 0},//第五题，1
            v52: {type: sequelize.INTEGER, defaultValue: 0},//第五题，2
            v53: {type: sequelize.INTEGER, defaultValue: 0},//第五题，3
            v54: {type: sequelize.INTEGER, defaultValue: 0},//第五题，4
            v55: {type: sequelize.INTEGER, defaultValue: 0},//第五题，5
            v56: {type: sequelize.INTEGER, defaultValue: 0},//第五题，6
            v57: {type: sequelize.INTEGER, defaultValue: 0},//第五题，7
            v58: {type: sequelize.INTEGER, defaultValue: 0},//第五题，8
            v59: {type: sequelize.INTEGER, defaultValue: 0},//第五题，9
            v510: {type: sequelize.INTEGER, defaultValue: 0},//第五题，10
            coupons: {type: sequelize.INTEGER, defaultValue: 0},//优惠券数量
            couponsUsed: {type: sequelize.INTEGER, defaultValue: 0},//已被领取的优惠券数量
            views: {type: sequelize.INTEGER, defaultValue: 0},//门店浏览量
            votes: {type: sequelize.INTEGER, defaultValue: 0},//门店投票量
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
        db.dayStoreVote.belongsTo(db.store);
    },
};