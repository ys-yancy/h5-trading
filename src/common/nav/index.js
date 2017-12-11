"use strict";

var Base = require('../../app/base');
var Uri = require('../../app/uri');

export default class Nav extends Base {
    constructor() {
        super();

        this._initAttrs();
    }

    _initAttrs() {
        this.el = $('#J_Header');
        var src = new Uri().getParam('src');

        if (src) {
            $('.go-back')
                .show()
                .attr('href', src);
        }
    }
}