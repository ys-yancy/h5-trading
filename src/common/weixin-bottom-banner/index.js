"use strict";

require('./index.css');
var Base = require('../../app/es6-base');
var tmpl = require('./index.ejs');

export default class BottomBanner extends Base {
    constructor() {
        super(arguments[0]);
        this._render();
        this._bind();
    }

    _bind() {
        this.subscribe('reset:bottom', this._resize, this);
    }

    _resize() {
        var el = $('.weixin-bottom-banner');
        el.hide();
        setTimeout(() => {
            el.show();
        }, 500);
    }

    hide() {
        $('.weixin-bottom-banner').hide();
    }

    _render() {
        this.renderTo(tmpl, {
            page: this.page
        }, $(document.body));
    }
}