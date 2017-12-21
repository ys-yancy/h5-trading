"use strict";

var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var Dialog = require('../../common/dialog');
var Uri = require('../../app/uri');
var Util = require('../../app/util');
var Config = require('../../app/config');
var Cookie = require('../../lib/cookie');
var Sticky = require('../../common/sticky');
var tmpl = require('./index.ejs');
// var CustomerService = require('../../common/customer-service');

function Account() {
    Account.superclass.constructor.apply(this, arguments);
    var self = this;

    this.login().then(function() {
        if (self.cookie.get('goType')) {
            self.cookie.set('type', 'real');
        }
        self.init();
    }, function() {
        location.href = './option.html';
    });
}

Base.extend(Account, PageBase, {
    init: function() {
        this._setStyle();
        this._checkOnly();
        this._bind();
        this._requires();
        this._getAccount();
        this.configStatistics();
    },

    _bind: function() {
        var doc = $(document);

        doc.on('tap', '.J_Switch', $.proxy(this._switch, this));
        this.subscribe('reject:realToken', this._rejectRealToken, this);

        // 添加默认微信分享
        if (this.isWeixin()) {
          this.setupWeiXinShare('default_invite');
        }
    },

    _switch: function(e) {
        var curEl = $(e.currentTarget);

        if (curEl.hasClass('active')) {
            return;
        }

        curEl.siblings().removeClass('active');
        curEl.addClass('active');

        if (curEl.hasClass('demo')) {
            Cookie.set('type', getSimulatePlate() ? 'demo' : 'real', {
                expires: Infinity
            });
        } else {
            Cookie.set('type', 'real', {
                expires: Infinity
            });
        }

        this._getAccount();
    },

    _rejectRealToken: function() {
        Cookie.set('type', getSimulatePlate() ? 'demo' : 'real', {
            expires: Infinity
        });

        this._setStyle();
    },

    _setStyle: function() {
        var type = Cookie.get('type'),
            listEl = $('#J_List'),
            demoListEl = $('#J_DemoList'),
            actionEl = $('#J_Action'),
            demoActionEl = $('#J_DemoAction');

        if ( type == 'demo' ) {
            $('.J_Switch', 'nav').removeClass('active');
            $('.J_Switch.demo', 'nav').addClass('active');

            listEl.hide();
            actionEl.hide();
            demoListEl.show();
            demoActionEl.show();
        } else {
            $('.J_Switch', 'nav').addClass('active');
            $('.J_Switch.demo', 'nav').removeClass('active');

            listEl.show();
            demoListEl.hide();

            if ( false ) { // 测试盘
                actionEl.hide();
            } else {
                actionEl.show();
            }
            demoActionEl.hide();
        }

        $('#J_Loading').hide();
    },

    _getAccount: function() {
        var self = this,
            type = this.isDemo() ? 'demo' : 'real',
            el = this.isDemo() ? $('#J_DemoList') : $('#J_List');
        var jl = $('#J_DemoList');

        if (jl) {
            jl.hide();
        }

        this.getAccount().then(function(data) {
            $('#J_Loading').show();
            $('.J_Content', '.content').hide();
            self.account = data.account;
            return self.getCurrentOrderList();
        }).then(function(data) {
            var margin = data.margin;
            self.getFloatingProfit(self.account, data.list, data.symbols).done(function(profit, floatOption) {
                var balance = parseFloat(self.account[type].balance);
                var netDeposit = balance + parseFloat(profit);
                var freeMargin = netDeposit - parseFloat(data.margin);
                var bait = parseFloat(self.account[type].bait ? self.account[type].bait : 0);
                var bonus = parseFloat(self.account[type].bonus ? self.account[type].bonus : 0);
                var untriggeredBonus = parseFloat(self.account[type].untriggered_bonus ? self.account[type].untriggered_bonus : 0);
                var triggered_bonus = parseFloat(self.account[type].triggered_bonus ? self.account[type].triggered_bonus : 0);
                var expired_bonus = parseFloat(self.account[type].expired_bonus ? self.account[type].expired_bonus : 0);
               
                var rate;
                if (data.margin == 0) {
                  rate = '--';
                } else {
                  rate = (( freeMargin + margin - Math.max(margin, untriggeredBonus) + margin ) / margin * 100).toFixed(2);
                }
                
        
                var tmplData = {
                    netDeposit: netDeposit,
                    freeMargin: freeMargin,
                    profit: profit,
                    rate: rate,
                    type: type,
                    edit: self.edit,
                    margin: margin,
                    balance: balance,
                    bait: bait,
                    bonus: bonus,
                    triggeredBonus: triggered_bonus,
                    unTriggeredBonus: untriggeredBonus,
                    expiredBonus: expired_bonus
                };

                self.render(tmpl, tmplData, el);
                
                self._setStyle();
            });
        }, function() {
            Cookie.set('type', getSimulatePlate() ? 'demo' : 'real', {
                 expires: Infinity
            });
            self._getAccount();
        });
    },

    _checkOnly: function() {
        var navEl = $('nav');
        //  在微信中是否是现实实盘
        if (Util.isWeixin() && getWeiXinIsHasReal()) { 
            if (getIsOnlyShowReal()) {
                navEl.hide();
            } else {
                navEl.show(); 
            } 
        } else {
            navEl.show(); 
        }

        if (getSimulatePlate()) {
            navEl.hide();
        }
    },

    _requires: function() {
        $('nav').sticky();
        
        // 如果是Android内置webview就不显示下载条和抽奖入口
        if (!Config.isAndroidAPK() && getIfShowDLinkWL()) {
            $('.footer').append('<div class="bottom-banner" id="J_Banner">\
                <span class="close-wrapper J_CloseBanner">\
                    <span class="close icon"></span>\
                </span>\
                <span class="desc">详细资产流水请登录APP</span>\
                <a class="login J_Login" href="http://a.app.qq.com/o/simple.jsp?pkgname=com.invhero.android">下载APP</a>\
                </div>');
        }
    },
});

new Account();