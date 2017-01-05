module.exports = {
    fields: (sequelize)=> {
        return {
            key: {type: sequelize.STRING, allowNull: false},
            value: sequelize.TEXT
        };
    },
    config: {
        timestamps: false,
        classMethods: {
            set: function (key, value) {
                let _v;
                try {
                    _v = JSON.stringify(value);
                } catch (e) {
                    _v = value;
                }
                // console.log('set ', key, _v);
                return this.update({value: _v}, {where: {key: key}});
            },
            get: function *(key, defaultValue = null) {
                let obj = yield this.findOne({raw: true, where: {key: key}});
                if (!obj) return defaultValue;
                try {
                    return JSON.parse(obj.value);
                } catch (e) {
                    return obj.value;
                }
            }
        },
    }
};
