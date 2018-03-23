"use strict";

var Base = require('../../../../app/base');
var Uri = require('../../../../app/uri');
var tmpl = require('./index.ejs');
export default class PayType extends Base {
    constructor(config) {
        super(config);

        this._init();
    }

    _init() {
        this._render();
    }

    _lazyBind() {
        this.el.on('click', '.J_Fold', $.proxy(this._fold, this));

        this.el.on('click', '.pay-item', (e) => {
            var curEl = $(e.currentTarget);

            if (curEl.hasClass('active')) {
                return false;
            }

            curEl.siblings().removeClass('active');
            $('.J_Radio').removeClass('active');

            curEl.addClass('active');
            $('.J_Radio', curEl).addClass('active');
            
            $('.J_Fold').trigger('click');
        });
    }

    _fold(e) {
        var curEl = $(e.currentTarget);

        if (curEl.hasClass('unfold')) {
            curEl.parent().removeClass('unfold');
            curEl.removeClass('unfold');
        } else {
            curEl.parent().addClass('unfold');
            curEl.addClass('unfold');
        }
    }

    _render() {
        this.renderTo(tmpl, getShowPayWay(), this.el);
        this._lazyBind();
    }
}