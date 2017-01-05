module.exports = {
    fields: (sequelize)=> {
        return {
            name: sequelize.STRING,
            code: {type: sequelize.INTEGER, unique: 'code'},
            work: {type: sequelize.BOOLEAN, defaultValue: true},
        };
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
        db.manager.belongsTo(db.store);
        db.manager.hasMany(db.dayManagerVote);
    },
};