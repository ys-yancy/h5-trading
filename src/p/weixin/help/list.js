"use strict";

require('../../../lib/zepto');
var Header = require('../../../common/header');
var Uri = require('../../../app/uri');
var Sticky = require('../../../common/sticky');


class HelpList {
    constructor() {
        this._requires();
        this._initAttrs();
    }

    _requires() {
        var header = new Header();
        header.show();
    }

    _initAttrs() {
        var src = new Uri().getParam('src');

        if (!src) {
            $('.go-back').hide();
            $('#J_Header').sticky();
        }
    }
}

new HelpList();