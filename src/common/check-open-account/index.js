'use strict';

export default class CheckOpenAccount{
    constructor() {
        this._check();
        location.href = './open-account.html?src=' + encodeURIComponent(location.href);
    }

    _check() {
        // this._isNeedOpenAccount().then((data) => {
        //     location.href = './open-account.html?src=' + encodeURIComponent(location.href);
        // })
    }

    _isNeedOpenAccount() {

    }
}