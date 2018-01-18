'use strict';

var Base = require('../../app/base');
var Cookie = require('../../lib/cookie');
export default class CheckOpenAccount extends Base{
    constructor(config) {
        super(config);
        // this._check();
    }

    _check() {
        // 先判断入金， 再判断开户
        this._isNeedOpenAccount().then((data) => {
            // location.href = './open-account.html?src=' + encodeURIComponent(location.href);
        }, () => {})
    }

    _isRechargeSuccess() {
        return
    }

    _isNeedOpenAccount() {
        return new Promise((resolve, reject) => {
            var isOpendAccount = Cookie.get('is_open_account');
            if (isOpendAccount == 1)
                reject();
                return;

            this.ajax({
                url: '/v1/deposit/user/info/',
                data: {
                    access_token: Cookie.get('token')
                },
                noToast: true
            }).then((data) => {
                if (data.status == 200 && data.data.id_no) {
                    reject()
                } else {
                    resolve();
                }
            }, () => {
                resolve();
            })
        })
    }
}