"use strict";

require('../../lib/zepto');
var Sticky = require('../../common/sticky');


class Privacy {
    constructor() {
        this._sticky();
    }

    _sticky() {
        $('header').sticky();
    }
}

new Privacy();