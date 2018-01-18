'use strict';

var PageBase = require('../../app/page-base');
var Cookie = require('../../lib/cookie');
export default class CheckOpenAccount extends PageBase{
    constructor(config) {
        super(config);
        this._check();
    }

    _check() {
        // 先判断入金, 再判断开户
        this._isRechargeSuccess().then(() => {
            this._isNeedOpenAccount().then((data) => {
                location.href = './open-account.html?src=' + encodeURIComponent(location.href);
            }, () => {})
        }, () => {});
    }

    _isRechargeSuccess() {
        return new Promise((resolve, reject) => {
            var deposits = Cookie.get('deposits');
 
            if (!isNaN(deposits)) {
                if (deposits == 1) {
                    resolve();
                } else {
                    reject();
                }
                return;
            }

            this.getAccount().then((data) => {
                var deposits = data.deposits;
                if (deposits == 1) {
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
            if (isOpendAccount == 1)
                reject();
                return;

            this._getUserInfo().then((data) => {
                if (data.status == 200 && data.data.id_no) {
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