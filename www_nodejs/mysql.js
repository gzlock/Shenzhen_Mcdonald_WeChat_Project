const co = require('co');
const db = require('./sequelize');
const config = require('./config')(process.env.NODE_ENV);
// console.log('mysql.js env:', process.env.NODE_ENV);

co(function *() {
    yield  db.sequelize.query('SET FOREIGN_KEY_CHECKS=0;');
    console.log('sequelize sync 1');
    yield db.sequelize.sync({force: false, debug: true,});
    console.log('sequelize sync 2');
    if (config.data) {
        for (let i in config.data) {
            let _db = db[i];
            if (!_db) continue;
            console.log(`sequelize fill data: ${_db.name}`);
            for (let j in config.data[i])
                yield _db.create(config.data[i][j]);
        }
    }
    yield  db.sequelize.query('SET FOREIGN_KEY_CHECKS=1;');
    console.log('I\'m finish.');
});
