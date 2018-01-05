"use strict";

var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var Cookie = require('../../lib/cookie');
var Toast = require('../../common/toast');
var Config = require('../../app/config');
var Uri = require('../../app/uri');

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
    },

    _bind: function() {
        var doc = $(document);

        // 添加默认微信分享
        if (this.isWeixin()) {
          this.setupWeiXinShare('default_invite');
        }
    },

    _initAttrs: function() {
        var params = new Uri().getParams();
        var router = params.router;

        if (router) {
            $('#J_NavBack').attr('href', router);
        }

        // 设置iFrame高度
        var doc = document;
        var cHeight = Math.max(doc.body.clientHeight, doc.documentElement.clientHeight)
        var sHeight = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight)
        var height  = Math.max(cHeight, sHeight)

        $('#J_Frame')[0].height = height - $('#J_Header')[0].clientHeight;
    }
});

new Cs();