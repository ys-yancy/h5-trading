"use strict";

var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var Uri = require('../../app/uri');
var Login = require('../../common/login');
var Config = require('../../app/config');

function Risk() {
    Risk.superclass.constructor.apply(this, arguments);
    var self = this;
    this.getToken().then(function() {
    self.init();
    });
}

Base.extend(Risk, PageBase, {
    init: function() {
        this._initAttrs();
        this._requires();
        this.configStatistics();
    },

    _requires: function() {
        this.login = new Login();

        // 添加默认微信分享
        if (this.isWeixin()) {
          this.setupWeiXinShare('default_invite');
        }
    },

    _initAttrs: function() {
        var url = new Uri().getParam('src');

        if (url) {
            $('.go-back', 'header').attr('href', url);
            this.url = url;
        }


        var statementEl = $('#J_Statement');
        var href = statementEl.attr('href');

        statementEl.attr('href', href + '?src=' + encodeURIComponent(location.href));


        var content = getRiskMessageHTMLWL();

        // 需要替换关于我们的内容
        if (content != null) {
            $('.content').html(content);
        }
    },

    attrs: {
        
    }

});

new Risk();