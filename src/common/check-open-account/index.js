'use strict';

var PageBase = require('../../app/page-base');
var Cookie = require('../../lib/cookie');
export default class CheckOpenAccount extends PageBase{
    constructor(config) {
        super(config);
        this._check();
    }

    check() {
        this._check();
    }

    _check() {
        // 先判断入金, 再判断开户
        this._isNeedOpenAccount().then(() => {
            this._isRechargeSuccess().then((data) => {
                location.href = './open-account.html?src=' + encodeURIComponent(location.href);
            }, () => {})
        }, () => {});
    }

    _isRechargeSuccess() {
        return new Promise((resolve, reject) => {
            var deposits = Cookie.get('deposits');

            // 只要入过金，并且没有开过户，就应该去开户
            if (!isNaN(deposits) && deposits > 0) {
                resolve();
                return;
            }

            this.getAccount().then((data) => {
                var deposits = data.deposits;
                if (deposits > 0) {
                    resolve();
                } else {
                    reject();
                }
            })
        })
    }

    _isNeedOpenAccount() {
        return new Promise((resolve, reject) => {
            var isOpendAccount = Cookie.get('is_open_account');

            if (isOpendAccount == 1) {
                reject();
                return;
            }

            this._getUserInfo().then((data) => {
                this.broadcast('get:user:open-account', data);
                if (data.data.have_info == 1) {
                    reject()
                } else {
                    resolve();
                }
            }, () => {
                resolve();
            });
        })
    }

    _getUserInfo() {
        return this.ajax({
            url: '/v1/deposit/user/info/',
            data: {
                access_token: Cookie.get('token')
            },
            noToast: true
        });
    }

}