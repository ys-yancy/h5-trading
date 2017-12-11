"use strict";

var Base = require('../../app/base');
var Util = require('../../app/util');
var PageBase = require('../../app/page-base');
var Dialog = require('../../common/dialog/index');
var Uri = require('../../app/uri');

function RegisterGuide() {
    RegisterGuide.superclass.constructor.apply(this, arguments);
    var self = this;
    // this.getToken().then(function() {
    self.init();
    // });
}

Base.extend(RegisterGuide, PageBase, {
    init: function() {
        this._initHeight();
        this._initDevice();
        this.configStatistics();
        this._initAttrs();
    },

    _bind: function() {
        // 添加默认微信分享
        if (this.isWeixin()) {
          this.setupWeiXinShare('default_invite');
        }

    },

    _initAttrs: function() {
        var params = new Uri().getParams();
        /*
         * kind: 
         *    dl: 只显示下载入口
         *    n: 普通流程, 显示直接去option的入口
         */

        this.kind = params.kind;
        if (this.kind === 'dl') {
            $('#J_WebApp').remove();
        }
    },

    _initHeight: function() {
        var wrapperEl = $('.action-wrapper'),
            height = wrapperEl.height(),
            offsetTop = wrapperEl.offset().top;

        if ($(window).height() < height + offsetTop) {
            $('.content').addClass('thin');
        }
    },

    _initDevice: function() {
        if (Util.isIOS()) {
            $('#J_Android').remove();
        } else if (Util.isAndroid()) {
            $('#J_iOS').remove();
        } else {
            $('#J_Android').remove();
            $('#J_iOS').remove();
        }
    }
});

new RegisterGuide();