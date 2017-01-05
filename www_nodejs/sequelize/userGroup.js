module.exports = {
    fields: (Sequelize)=> {
        return {
            name: {type: Sequelize.STRING, allowNull: false, unique: 'name'},
        };
    },
    config: (db)=> {
        return {timestamps: false,};
    },
    associate: (db)=> {
        db.userGroup.hasMany(db.user);
    },
};
