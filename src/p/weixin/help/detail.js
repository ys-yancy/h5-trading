"use strict";

require('../../../lib/zepto');
var Header = require('../../../common/header');


class HelpDetail {
    constructor() {
        this._requires();
    }

    _requires() {
        new Header();
    }
}

new HelpDetail();