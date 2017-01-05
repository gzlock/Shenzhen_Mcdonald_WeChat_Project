const utils = require('../function/utils');
module.exports = {
    fields: (sequelize)=> {
        return {};
    },
    config: (db)=> {
        return {
            timestamps: false,
            defaultScope: {},
            scopes: {},
            hooks: {},
        };
    },
    associate: (db)=> {
        db.voteManager.belongsTo(db.vote);
        db.voteManager.belongsTo(db.store);
        db.voteManager.belongsTo(db.manager);
    },
};