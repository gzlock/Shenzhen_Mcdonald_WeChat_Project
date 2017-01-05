const Router = require('koa-router');
const moment = require('moment');
const utils = require('../../function/utils');
const router = module.exports = new Router();

router.get('/:cid', function *() {
    if (!this.session.openid) this.throw('投票后才能兑换优惠券', 403);
    let coupon = yield this.mysql.coupon.findOne({where: {cid: this.params.cid}, include: [{model: this.mysql.store}]});
    if (!coupon) this.throw('没有找到对应的优惠券', 404);
    if (coupon.used) this.throw('这张优惠券已被使用', 403);
    yield coupon.set({used: true}).save();

    utils.getDayStoreVote(this.mysql, {
        storeId: coupon.storeId,
        time: coupon.createdAt,
    }, {coupons: 1, couponsUsed: 1, votes: 1},vote=>{
        if(vote.isNew)return;
        vote.increment('couponsUsed');
    });

    yield this.show(coupon.store.code7);
});
