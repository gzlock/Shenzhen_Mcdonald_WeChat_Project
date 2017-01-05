const utils = require('../function/utils');
module.exports = {
    fields: (sequelize)=> {
        return {name: {type: sequelize.STRING, unique: 'name'}};
    },
    config: (db)=> {
        return {
            defaultScope: {},
            scopes: {},
            hooks: {},
        };
    },
    associate: (db)=> {
        db.storeDO.hasMany(db.store);
        db.storeDO.hasMany(db.storeOM);
        db.storeDO.hasMany(db.storeOC);
    },
};