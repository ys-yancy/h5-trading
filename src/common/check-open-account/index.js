'use strict';

var Base = require('../../app/base');
var Cookie = require('../../lib/cookie');
export default class CheckOpenAccount extends Base{
    constructor(config) {
        super(config);
        this._check();
    }

    _check() {
        this._isNeedOpenAccount().then((data) => {
            location.href = './open-account.html?src=' + encodeURIComponent(location.href);
        }, () => {
            // console.log('no recharge')
        })
    }

    _isNeedOpenAccount() {
        return new Promise((resolve, reject) => {
            this.ajax({
                url: '/v1/deposit/user/info/',
                data: {
                    access_token: Cookie.get('token')
                },
                noToast: true
            }).then((data) => {
                resolve();
            }, () => {
                reject()
            })
        })
    }
}