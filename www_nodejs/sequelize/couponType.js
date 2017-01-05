const utils = require('../function/utils');
const shortid = require('shortid');
module.exports = {
    fields: (sequelize)=> {
        return {
            type: {type: sequelize.ENUM('6', '7')},
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
        db.couponType.hasOne(db.store);
    },
};