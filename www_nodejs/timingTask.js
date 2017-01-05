const later = require('later');
const mysql = require('./sequelize');
const co = require('co');
const moment = require('moment');
const lodash = require('lodash');

const minute = 5;
let sched = later.parse.recur().every(minute).minute();

//todo 调试
// co(stores(moment().startOf('day')));

//每5分钟统计一次数据
later.setInterval(()=> {
    console.log('执行统计,时间', moment().format('HH:mm:ss'));
    let start = moment().subtract(minute, 'minute').startOf('minute');
    co(stores(start)).catch(err=> {
        console.log('has error', err);
    });
}, sched);

const storeVoteDateTemplate = {
    v10: 0,
    v11: 0,
    v12: 0,
    v13: 0,
    v14: 0,
    v15: 0,

    v2: 0,

    v30: 0,
    v31: 0,
    v32: 0,
    v33: 0,
    v34: 0,
    v35: 0,
    v36: 0,
    v37: 0,
    v38: 0,
    v39: 0,

    v4Total: 0,//第四题，总的打赏金额
    v40: 0,//第四题，投0的次数
    v41: 0,//第四题，投1的次数
    v42: 0,//第四题，投2的次数
    v43: 0,//第四题，投3的次数

    v5Total: 0,//第五题，总得分
    v50: 0,//第五题，0
    v51: 0,//第五题，1
    v52: 0,//第五题，2
    v53: 0,//第五题，3
    v54: 0,//第五题，4
    v55: 0,//第五题，5
    v56: 0,//第五题，6
    v57: 0,//第五题，7
    v58: 0,//第五题，8
    v59: 0,//第五题，9
    v510: 0,//第五题，10

    coupons: 0,//优惠券数量
    votes: 0,//门店投票量
};

function *stores(start) {

    let startOfDay = moment().startOf('day').toDate();
    let createdAt = {createdAt: {$between: [startOfDay, moment().endOf('day').toDate()]}};

    /**
     * 统计门店
     * @type {{}}
     */
    let stores = {};
    let votes = yield mysql.vote.findAll({
        raw: true,
        where: {createdAt: {$gte: start.toDate()}},
        attributes: {exclude: ['ip', 'province', 'city', 'openid', 'createdAt', 'updatedAt', 'v310']}
    });

    let voteAndStoreId = {};
    for (let i in votes) {
        let vote = votes[i];
        voteAndStoreId[vote.id] = vote.storeId;
        let store = stores[vote.storeId];
        if (!store) {
            stores[vote.storeId] = store = Object.assign({}, storeVoteDateTemplate);
        }
        store.votes++;
        storeVoteData(store, vote);
    }

    /**
     * 统计经理
     */
    let managerVotes = yield mysql.voteManager.findAll({
        raw: true,
        where: {voteId: {$in: Object.keys(voteAndStoreId)}},
        attributes: {exclude: ['createdAt', 'updatedAt']}
    });

    let managers = {};
    for (let i in managerVotes) {
        let store = stores[managerVotes[i].storeId];
        if (!store) continue;
        let manager = managers[managerVotes[i].id];
        if (!manager)
            managers[managerVotes[i].managerId] = manager = {storeId: managerVotes[i].storeId, like: {like: 0}};
        manager.like.like++;
    }

    let couponsData = yield mysql.coupon.findAll({
        raw: true,
        where: {voteId: {$in: Object.keys(voteAndStoreId)}},
    });
    for (let i in couponsData) {
        let coupon = couponsData[i];
        let store = stores[coupon.storeId];
        if (!store) continue;
        store.coupons++;
    }

    console.log('投票量', votes.length, managerVotes.length);
    //提交门店数据
    if (votes.length > 0) {
        for (let i in stores) {
            i = parseInt(i);
            let store = stores[i];
            mysql.dayStoreVote.findOrCreate({
                where: {
                    storeId: i,
                    createdAt,
                },
                defaults: Object.assign({createdAt: startOfDay}, store),
            }).spread((vote, isNew)=> {
                // console.log('isNew', vote.id, vote.storeId, isNew);
                if (isNew)return;
                vote.increment(store);
            });
        }
    }

    //提交经理数据
    if (managerVotes.length > 0) {
        for (let i in managers) {
            let manager = managers[i];
            mysql.dayManagerVote.findOrCreate({
                where: {
                    managerId: i,
                    storeId: manager.storeId,
                    createdAt,
                },
                defaults: {createdAt: startOfDay, like: manager.like.like},
            }).spread((vote, isNew)=> {
                if (isNew)return;
                vote.increment(manager.like);
            });
        }
    }
}

function storeVoteData(storeData, data) {
    for (let key in data) {
        if (key == 'v4' || key == 'v5') {
            let total = key + 'Total';
            storeData[total] += data[key];
            storeData[key + data[key]]++;
        } else if (data[key] && storeData.hasOwnProperty(key)) {
            storeData[key]++;
        }
    }
}

