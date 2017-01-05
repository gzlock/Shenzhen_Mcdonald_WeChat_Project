const crypto = require('crypto');
const moment = require('moment');
const config = require('../config')(process.env.NODE_ENV);
let utils = module.exports = {
    /**
     * 随机颜色
     * @return {string}
     */
    randomColor: ()=> {
        let letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    },

    /**
     * 在列表中根据fid找到版块信息
     * @param fid
     * @param list
     * @return {*}
     */
    findForum: (fid, list)=> {
        let target;
        for (let i in list) {
            if (list[i].fid == fid) {
                target = list[i];
                break;
            }
            else if (list[i].children) {
                target = utils.findForum(fid, list[i].children);
                if (target) break;
            }
        }
        return target;
    },

    /**
     * 找到fid的父级版块
     * @param fid
     * @param list
     * @param parent
     * @return {*}
     */
    findForumParent: (fid, list, parent)=> {
        for (var i in list) {
            var item = list[i];
            if (item.fid == fid) {
                if (parent) return parent;
                return item;
            } else if (item.children) {
                var find = utils.findForumParent(fid, item.children, item);
                if (find)
                    return find;
            }
        }
        return null;
    },

    /**
     * 找到fid的整个版块关系
     * @param id
     * @param list
     * @return {*}
     */
    findForumParents: (id, list)=> {
        var result = [];
        for (var i in list) {
            var item = list[i];
            if (item.id == id) {
                return [item];
            } else if (item.children) {
                var find = utils.findForumParents(id, item.children);
                if (find.length > 0) {
                    result = result.concat(find);
                    result.splice(0, 0, item);
                }
            }
        }
        return result;
    },
    /**
     * 将版块的多维数组转为一维数组
     * @param list
     * @return {Array}
     */
    forumListToArray: list=> {
        let result = [];
        for (let i in list) {
            let item = list[i];
            result.push(item);
            if (item.children && item.children.length > 0) {
                result = result.concat(utils.forumListToArray(item.children));
            }
        }
        return result;
    },

    /**
     * sha1加密运算
     * @param string
     * @param key
     * @return {*}
     */
    sha1: (string, key = config.sha1Key)=> {
        let sha1 = crypto.createHmac('sha1', key);
        sha1.update(string);
        return sha1.digest('hex');
    },
    /**
     * 将用户信息添加到session
     * @param session
     * @param user
     */
    sessionUser: (session, user)=> {
        session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            emailVerified: user.emailVerified,
            language: user.language,
            newNotifications: user.newNotifications,
            syncTime: Date.now(),//与mysql的同步时间
            userGroup: user.userGroup,
        };
    },

    /**
     * 从自制的language对象中返回moment用的格式
     * @param language
     * @return {string}
     */
    momentLanguage: language=> {
        return language == 'cn' ? 'zh-cn' : 'en';
    },
    /**
     * 过滤敏感字符,防止xss攻击
     * @param string
     * @return {string}
     */
    escape: string=> {
        return String(string)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/'/g, '&#39;')
            .replace(/"/g, '&quot;');
    },
    /**
     * 当前版块的版主，或游侠，或管理员都可以操作帖子
     * @param forum
     * @param user
     * @return {boolean}
     */
    canControlTopic: (forum, user)=> {
        return user.userGroup.id < 3 || forum.mod.indexOf(user.id) >= 0;
    },
    /**
     * 是否是否有权限进行某些操作
     * @param forum
     * @param user
     * @param action
     */
    hasForumPermission: (forum, user, action)=> {
        if (forum.permission.constructor == String)
            forum.permission = JSON.parse(forum.permission);
        let permission = forum.permission[!user ? 'guest' : 'user'];
        if (!user)//访客，非用户
            return !!permission[action];
        if (forum.mod.indexOf(user.id) >= 0)//版主
            return true;
        return !!permission[action];
    },

    hasProjectPermission: (project, user, action)=> {
        let isUser = !!user;
        isUser = isUser && project.user.indexOf(user.id) >= 0;
        let permission = project.permission[isUser ? 'user' : 'guest'];
        if (!isUser)//访客，非用户
            return !!permission[action];
        if (project.userId == user.id)//项目拥有者，拥有所有权限
            return true;
        if (project.mod.indexOf(user.id) >= 0)//版主，拥有所有权限
            return true;
        return !!permission[action];
    },

    /**
     * 生成完整的门店投票网址
     * @param sid
     */
    voteUrl: sid=> {
        return `http://${config.domain}/vote/${sid}`;
    },

    configUrl: ctx=> {
        let url = `http://${config.domain}${ctx.url}`;
        url = url.split('#')[0];
        // console.log('configUrl', url);
        return url;
    },

    /**
     * 获取指定时间的门店投票统计记录
     * @param mysql
     * @param where
     * @param defaults
     * @return {Promise}
     */
    getDayStoreVote: function (mysql, where, defaults = {}, cb) {
        let start, end;
        if (where.time) {
            start = moment(where.time).startOf('day').toDate();
            end = moment(where.time).endOf('day').toDate();
        } else {
            start = moment().startOf('day').toDate();
            end = moment().endOf('day').toDate();
        }
        return new Promise((resolve, reject)=> {
            mysql.dayStoreVote.findOrCreate({
                where: {
                    storeId: where.storeId,
                    createdAt: {$between: [start, end]}
                },
                defaults: Object.assign({}, defaults, {createdAt: start, views: 1}),
            }).spread((vote, isNew)=> {
                vote.isNew = isNew;
                resolve(vote);
                cb && cb(vote);
            })
        });
    },
    /**
     * 判断请求是html还是json
     * @param ctx
     * @return {void|string|string[]|*}
     */
    requestType: ctx=> {
        return ctx.accepts('html', 'json');
    },
};