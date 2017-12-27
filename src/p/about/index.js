"use strict";

var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var Uri = require('../../app/uri');
var Login = require('../../common/login');
var Config = require('../../app/config');

function About() {
    About.superclass.constructor.apply(this, arguments);
    var self = this;
    this.getToken().then(function() {
    self.init();
    });
}

Base.extend(About, PageBase, {
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


        var content = getAboutUSHTMLWL();

        // 需要替换关于我们的内容
        if (content != null) {
            $('.content').html(content);
        }
        else {
            $('.content').html('<div class="hd"><div class="hd-bg"></div></div><ul class="bd bd-first"><li><a class="my-count" href="./privacy.html"><span class="J_Account account">隐私条款</span><span class="arrow-right"></span></a></li><li><a class="my-gift" href="./about-me.html">关于壹号金融<span class="arrow-right"></span></a></li><li><a class="" >版本<span class="version">1.0.1</span></a></li></ul>');
        }
    },

    attrs: {
        
    }

});

new About();