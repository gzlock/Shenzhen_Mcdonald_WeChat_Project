const Sequelize = require('sequelize');
const moment = require('moment');
const xlsx = require('node-xlsx');

let u = module.exports = {
    /**
     *
     * @param mysql
     * @param {[]}storesId
     * @param {[]}timeRange
     */
    storeVote: function *(mysql, storesId, timeRange) {
        let storesData = yield mysql.store.findAll({
            where: {id: {$in: storesId}},
            include: [
                {model: mysql.storeDO},
                {model: mysql.storeOM},
                {model: mysql.storeOC},
            ]
        });
        let stores = {};
        let attributes = {
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
            v4Total: 0,
            v40: 0,
            v41: 0,
            v42: 0,
            v43: 0,
            v5Total: 0,
            v50: 0,
            v51: 0,
            v52: 0,
            v53: 0,
            v54: 0,
            v55: 0,
            v56: 0,
            v57: 0,
            v58: 0,
            v59: 0,
            v510: 0,
            coupons: 0,
            couponsUsed: 0,
            views: 0,
            votes: 0
        };
        for (let i in storesData) {
            let s = storesData[i];
            let store = stores[s.id] = {
                name: s.name,
                code4: s.code4,
                code7: s.code7,
                DO: s.storeDO.name,
                OM: s.storeOM.name,
                OC: s.storeOC.name,
                managers: {},
            };
            Object.assign(store, attributes);
            // console.log('store', store.name, store);
        }
        let where = {
            raw: true,
            where: {
                StoreId: {$in: storesId},
                createdAt: {$between: timeRange}
            },
            attributes: [
                'storeId',
            ],
            group: ['storeId'],
        };
        for (let i in attributes) {
            where.attributes.push([Sequelize.fn('sum', Sequelize.col(i)), i]);
        }
        let votes = yield mysql.dayStoreVote.findAll(where);

        for (let i in votes) {
            let vote = votes[i];
            let store = stores[vote.storeId];
            for (let i in attributes) {
                store[i] += vote[i];
            }
        }
        return stores;
    },

    /**
     *
     * @param mysql
     * @param stores
     * @param timeRange
     */
    managerVote: function *(mysql, stores, timeRange) {
        let storesId = Object.keys(stores);
        let voteData = yield mysql.dayManagerVote.findAll({
            raw: true,
            where: {
                storeId: {$in: storesId},
                createdAt: {$between: timeRange},
            },
            attributes: ['storeId', 'managerId', [Sequelize.fn('sum', Sequelize.col('like')), 'like']],
            include: [{model: mysql.manager, attributes: ['id', 'name']}],
            group: ['storeId', 'managerId'],
        });
        for (let i in voteData) {
            let vote = voteData[i];
            let store = stores[vote.storeId];
            if (!store)
                continue;
            let manager = store.managers[vote.managerId];
            if (!manager)
                manager = store.managers[vote.managerId] = {name: vote['manager.name'], like: 0};
            manager.like += vote.like;
        }
        return stores;
    },
    /**
     * 根据门店ID，日期范围 读取 门店和经理的投票数据，返回汇总的数据对象
     * @param mysql
     * @param storesId
     * @param timeRange
     * @param loadVotesContent 是否读取投票内容
     * @return {*}
     */
    find: function *(mysql, storesId, timeRange, loadVotesContent = false) {
        let stores = yield this.storeVote(mysql, storesId, timeRange);
        let toDo = [this.managerVote(mysql, stores, timeRange)];
        if (loadVotesContent)
            toDo.push(this.loadVotes(mysql, stores, timeRange));
        yield toDo;
        return stores;
    },

    /**
     * 读取投票内容
     * @param mysql
     * @param stores
     * @param timeRange
     */
    loadVotes: function *(mysql, stores, timeRange) {
        let storesId = Object.keys(stores);
        let votes = yield mysql.vote.findAll({
            raw: true,
            attributes: ['storeId', 'v310', 'createdAt'],
            order: 'storeId asc',
            where: {
                $and: [
                    {v39: true},
                    Sequelize.where(Sequelize.fn('CHAR_LENGTH', Sequelize.col('v310')), '>', 2),
                    {StoreId: {$in: storesId}},
                    {createdAt: {$between: timeRange}},
                ]
            },
        });
        let store;
        for (let i in votes) {
            let vote = votes[i];
            if (!store || store.id != vote.storeId)
                store = stores[vote.storeId];
            if(!store)
                continue;
            let contents = store.contents;
            if (!contents)
                store.contents = contents = [];
            contents.push(vote.v310);
        }
    },

    /**
     * 生成XLSX文件，提供下载
     * @param ctx
     * @param filename
     * @param timeRange
     * @param stores
     */
    buildXLSX: function (ctx, filename, timeRange, stores) {
        let time = moment(timeRange[0]).format('YYYY-MM-DD_HH_mm_ss') + '__' + moment(timeRange[1]).format('YYYY-MM-DD' +
                '_HH_mm_ss');
        filename += time;
        time = moment(timeRange[0]).format('YYYY-MM-DD HH:mm:ss') + '到' + moment(timeRange[1]).format('YYYY-MM-DD' +
                ' HH:mm:ss');
        let storesTable = [['开始时间-截止时间',
                '四位编号', '七位编号', '店名', 'DO', 'OM', 'OC', '浏览量', '投票总量', '',
                '点餐收银区', '大堂服务', '甜品站', '麦咖啡', '厨房', '外卖员', '',
                '服务态度', '洗手间', '服务速度', '麦咖啡', '产品品质', '麦乐送', '产品准确', '得来速', '大堂清洁', '其他', '',
                '总打赏金额', '0元次数', '0元次数百分比', '1元次数', '1元次数百分比', '2元次数', '2元次数百分比', '3元次数', '3元次数百分比', '',
                '总推荐值', '推荐值', '0~6分次数', '0~6分次数百分比', '7~8分次数', '7~8分次数百分比', '9～10分次数', '9~10分次数百分比',
                '优惠券总量', '已用优惠券', '未用优惠券']],
            managerTable = [['开始时间-截止时间', '四位编号', '七位编号', '店名', 'DO', 'OM', 'OC', '姓名', '工号', '点赞总量', '点赞量', '点赞率']],
            voteTable = [
                ['只显示第三题投票选了"其它"并填了留言的内容'],
                ['开始时间-截止时间', '四位编号', '七位编号', '店名', 'DO', 'OM', 'OC', '留言'],
            ];

        for (let i in stores) {
            let store = stores[i];
            let v506 = store.v50 + store.v51 + store.v52 + store.v53 + store.v54 + store.v55 + store.v56;
            let v578 = store.v57 + store.v58;
            let v5910 = store.v59 + store.v510;
            let v5Calc = ((u.divide(v5910, store.votes) - u.divide(v506, store.votes)) * 100).toFixed(2) + '%';
            storesTable.push([time, store.code4, store.code7, store.name, store.DO, store.OM, store.OC, store.views, store.votes, '',
                u.percent(store.v10, store.votes), u.percent(store.v11, store.votes), u.percent(store.v12, store.votes),
                u.percent(store.v13, store.votes), u.percent(store.v14, store.votes), u.percent(store.v15, store.votes), '',
                u.percent(store.v30, store.votes), u.percent(store.v31, store.votes), u.percent(store.v32, store.votes),
                u.percent(store.v33, store.votes), u.percent(store.v34, store.votes), u.percent(store.v35, store.votes),
                u.percent(store.v36, store.votes), u.percent(store.v37, store.votes), u.percent(store.v38, store.votes),
                u.percent(store.v39, store.votes), '',
                store.v4Total, store.v40, u.percent(store.v40, store.votes), store.v41, u.percent(store.v41, store.votes), store.v42,
                u.percent(store.v42, store.votes), store.v43, u.percent(store.v43, store.votes), '',
                store.v5Total, v5Calc, v506, u.percent(v506, store.votes), v578, u.percent(v578, store.votes), v5910, u.percent(v5910, store.votes),
                store.coupons, store.couponsUsed, store.coupons - store.couponsUsed
            ]);
            if (store.managers) {
                for (let i in store.managers) {
                    let manager = store.managers[i];
                    managerTable.push([time, store.code4, store.code7, store.name, store.DO.name,
                        store.OM, store.OC, manager.name, manager.code, store.votes,
                        manager.like, u.percent(manager.like, store.votes)])
                }
                managerTable.push([time, store.code4, store.code7, store.name, store.DO,
                    store.OM, store.OC, '其他值班经理', '', store.votes, store.v2, u.percent(store.v2, store.votes)]);
            }
            if (store.contents) {
                for (let i in store.contents)
                    voteTable.push([time, store.code4, store.code7, store.name, store.DO,
                        store.OM, store.OC, store.contents[i]]);
            }
        }
        let file = xlsx.build([
            {name: '门店', data: storesTable},
            {name: '门店经理', data: managerTable},
            {name: '投票留言', data: voteTable}
        ]);
        filename += '.xlsx';
        filename = 'filename=' + encodeURI(filename);
        ctx.set({
            'Accept-Ranges': 'bytes',
            'Accept-Length': file.length,
            'Content-Transfer-Encoding': 'binary',
            'Content-Disposition': 'attachment; ' + filename,
            'Content-Type': 'application/octet-stream'
        });
        ctx.body = file;
    }
    ,
    /**
     * 组成时间范围数组
     * @param start
     * @param end
     * @return {*[]}
     */
    timeRange: (start, end)=> {
        start = moment(start, 'YYYY-MM-DD', true), end = moment(end, 'YYYY-MM-DD', true);
        start = start.isValid() ? start.startOf('day').toDate() : moment().startOf('day').toDate();
        end = end.isValid() ? end.endOf('day').toDate() : moment().endOf('day').toDate();
        if (moment().isSame(end, 'day'))
            end = moment().toDate();
        return [start, end];
    },
    isSameDate: (start, end, type = 'day')=> {
        return moment(start).isSame(end, type);
    },
    divide: (a, b)=> {
        a = Number(a);
        b = Number(b);
        if (a == 0 || b == 0)return 0;
        return a / b;
    },
    percent: (a, b, length = 2)=> {
        return (u.divide(a, b) * 100).toFixed(length) + '%';
    }
};