const utils = require('../function/utils');
module.exports = {
    fields: (sequelize)=> {
        return {
            username: {type: sequelize.STRING, validate: {len: [3, 20]}, unique: 'username'},
            password: {type: sequelize.STRING, allowNull: false,},
            value: {type: sequelize.INTEGER(1), allowNull: true, defaultValue: null}
        };
    },
    config: (db)=> {
        return {
            defaultScope: {
                include: [{model: db.userGroup}],
                attributes: {exclude: 'password'},
            },
            hooks: {
                beforeCreate: (user)=> {
                    user.password = utils.sha1(user.password);
                }
            },
        };
    },
    associate: (db)=> {
        db.user.belongsTo(db.userGroup);
        db.user.belongsToMany(db.store, {as: 'store', through: 'userShopMapping', unique: true});
    },
};