"use strict";

var PageBase = require('../../../../app/page-base');
var Util = require('../../../../app/util');
var Dialog = require('../../../../common/dialog');
var Config = require('../../../../app/config');
var Uri = require('../../../../app/uri');
var tmpl = require('./index.ejs');

class SyncInfo extends PageBase {
    constructor() {
        super(arguments[0]);
        this._bind();
    }

    _bind() {
        this.el.on('tap', '.J_Sync', $.proxy(this._sync, this));
    }

    //确认提示
    _sync (e) {
        var curEl = $(e.currentTarget);
        e.preventDefault();
        this.dialog = new Dialog({
            isShow: true,
            tmpl: this.render(tmpl),
            confirmCallback: null
        });
        $('.J_DialogConfirm').on('tap',$.proxy(this._getWeixinUrl, this))
    }

    //微信重定向获取用户信息
    _getWeixinUrl(w) {
        this._showLoad($('.J_Sync', this.el));
        var url = this.weixinUrlFirst;
        url += encodeURIComponent('?token=' + Cookie.get('token')+ '&wl='+ Cookie.get('wl') + '&ri=' + location.href );
        url += '&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect'; 
        location.href = url;
    }

    //同步中的一个login
    _showLoad(curEl) {
        var txt = curEl.text();
        curEl.attr('data-name', txt);
        curEl.html('<span>同步中<span class="dialog-load"></span></span>');
    }

}

module.exports = SyncInfo;