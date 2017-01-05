const shortid = require('shortid');
module.exports = {
    fields: (sequelize)=> {
        return {
            cid: {type: sequelize.STRING, defaultValue: shortid.generate, unique: 'cid'},
            used: {type: sequelize.BOOLEAN, defaultValue: false},
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
        db.coupon.belongsTo(db.store);
        db.coupon.belongsTo(db.vote);
        db.coupon.belongsTo(db.couponType);
    },
};