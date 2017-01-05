module.exports = {
    fields: (sequelize)=> {
        return {
            like: {type: sequelize.INTEGER, defaultValue: 0},//这位经理的点赞量
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
        db.dayManagerVote.belongsTo(db.store);
        db.dayManagerVote.belongsTo(db.manager);
    },
};