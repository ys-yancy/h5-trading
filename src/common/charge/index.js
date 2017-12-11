/**
 * 盛付通弹层 
 */
"use strict";
require('./index.css');

var PageBase = require('../../app/page-base');
var Dialog = require('../dialog');
var tmpl = require('./index.ejs');

class Charge extends PageBase {
    constructor(url, amount, paid_amount) {
        super();


        this.url = url;
        this.amount = amount;
        this.paid_amount = paid_amount;

        this._charge();

        //this._initAttrs();
        //this.show();
        //this._bind();
    }

    _initAttrs() {
        $('.charge-dialog').remove();
        this.dialog = new Dialog({
            isShow: false,
            tmpl: this.render(tmpl, {
                amount: this.amount,
                paid_amount: this.paid_amount
            }),
            cancleCallback: $.proxy(function() {
                clearTimeout(this.timer);
            }, this),
            confirmCallback: $.proxy(this._charge, this)
        });
    }

    show() {
        this.dialog.show();
        $('#J_Progress').addClass('start');
        this.timer = setTimeout(function() {
            this._charge();
        }.bind(this), 5 * 1000);
    }

    _charge() {
        this.postURL(this.url);
    }
}

module.exports = Charge;