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
        db.storeOC.hasMany(db.store);
        db.storeOC.belongsTo(db.storeOM);
        db.storeOC.belongsTo(db.storeDO);
    },
};