"use strict";

var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var Cookie = require('../../lib/cookie');
var Toast = require('../../common/toast');
var Config = require('../../app/config');
var Uri = require('../../app/uri');
var HistoryNav = require('../../common/history');

function Cs() {
    Cs.superclass.constructor.apply(this, arguments);
    var self = this;
    this.getToken().then(function() {
        self.init();
    });
}

Base.extend(Cs, PageBase, {
    init: function() {
        this._bind();
        this._initAttrs();
        this.configStatistics();

        new HistoryNav();
    },

    _bind: function() {
        var doc = $(document);

        // 如果是Android内置webview就不显示下载条
        if(Config.isAndroidAPK()) {
            $('#J_Banner').remove();
        }

        // 添加默认微信分享
        if (this.isWeixin()) {
          this.setupWeiXinShare('default_invite');
        }
    },

    _initAttrs: function() {
        var params = new Uri().getParams();

        var fullRouter = params.fullRouter;
        var kw = params.kw;
        var router = params.router;
        var accountType = params.account;
        var src = params.src;


        var link;

        if (router === 'order') {
            link = 'order.html?name=&' + this.name + '&symbol=' + this.symbol + '&order=' + this.order + '&price=' + this.price + '&stoploss=' + this.stoploss + '&takeprofit=' + this.takeprofit;
        } else if (router === 'list') {
            link = kw !== undefined ? router + '.html?kw=' + kw : router + '.html';
        } else if (src) {
            link = src;
        } else {
            link = router + '.html';
        }

        if (fullRouter) {
            link = fullRouter;
        }

        $('#J_NavBack').attr('href', link);


        // 设置iFrame高度
        var doc = document;
        var cHeight = Math.max(doc.body.clientHeight, doc.documentElement.clientHeight)
        var sHeight = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight)
        var height  = Math.max(cHeight, sHeight)

        $('#J_Frame')[0].height = height - $('#J_Header')[0].clientHeight;


    }
});

new Cs();