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
        db.storeOM.hasMany(db.store);
        db.storeOM.hasMany(db.storeOC);
        db.storeOM.belongsTo(db.storeDO);
    },
};