"use strict";

require('../../lib/zepto');
var Uri = require('../../app/uri');
var Sticky = require('../../common/sticky');


class Statement {
    constructor() {
        this._initAttrs();
        this._sticky();
    }

    _initAttrs() {
        var src = new Uri().getParam('src');

        this.headerEl = $('#J_Header');

        this.headerEl.show();
        if (!src) {
            return;
        }
        $('.go-back', this.headerEl).attr('href', src);
    }

    _sticky() {
        $('header').sticky();
    }
}

new Statement();