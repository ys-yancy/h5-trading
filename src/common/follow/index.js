"use strict";

require('./index.css');
var Base = require('../../app/es6-base');
var tmpl = require('./index.ejs');
var dialogTmpl = require('./dialog.ejs');
var Util = require('../../app/util');

class Follow extends Base {
    constructor() {
        super();

        // 如果是微信内才显示
        if (Util.isWeixin()) {
            this._show();
            this._bind();
        }
    }

    _bind() {
        var doc = $(document);
        this.el = $('#J_Follow');

        this.el.on('click', '.J_CloseBanner', function(e) {
            // alert(1)
            this.el.hide();
        }.bind(this));

        this.el.on('click', '.J_Qrcode', function(e) {
            this._showQRcode();
        }.bind(this));

        // doc.on('click', '.J_QRClose', function(e) {

        // }.bind(this));
    }

    _lazyBind() {
        document.getElementsByClassName('J_QRClose')[0].addEventListener('click', $.proxy(function(e) {
            this._hideQRcode();
        }, this), false);
    }

    _show() {
        this._render();
    }

    _render() {
        this.renderTo(tmpl, {}, $('footer'));

        //  $('.J_QRClose').on('click', function(e) {
        //     alert(e.target.className)
        // });

    }

    _showQRcode() {
        if (this.qrcode) {
            $('#J_QR').show();
            $('#J_QRMask').show();
        } else {
            this.qrcode = true;
            this.renderTo(dialogTmpl, {}, $(document.body));
            this._lazyBind();
        }
    }

    _hideQRcode() {
        $('#J_QR').hide();
        $('#J_QRMask').hide();
    }
}

module.exports = Follow;