"use strict";

var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var Uri = require('../../app/uri');
var Charge = require('../../common/charge');
var Sticky = require('../../common/sticky');
var CustomerService = require('../../common/customer-service'); 
var tmpl = require('./index.ejs');

function RechargeDemo() {
    RechargeDemo.superclass.constructor.apply(this, arguments);
    var self = this;
    this.login().then(function() {
        self.init();
    }, function() {
        var src = new Uri().getParam('src');
        src = src ? src : './my.html';
        location.href = src;
    });
}

Base.extend(RechargeDemo, PageBase, {
    init: function() {
        this._bind();
        this._requires();
        this._getData();
        this._initAttrs();
        this.configStatistics();
    },

    _bind: function() {
        var doc = $(document);

        doc.on('tap', '.J_Radio', $.proxy(this._select, this));
        doc.on('tap', '.J_Submit', $.proxy(this._submit, this));

        // 添加默认微信分享
        if (this.isWeixin()) {
          this.setupWeiXinShare('default_invite');
        }
    },

    _select: function(e) {
        var curEl = $(e.currentTarget);

        $('.J_Radio').removeClass('active');
        curEl.addClass('active');
    },

    _submit: function() {
        var self = this;

        this.params = this._getParams();

        var data = {
            access_token: this.cookie.get('token'),
            phone: this.cookie.get('phone'),
            back_url: location.href.replace('recharge-demo', 'account')
        }
        data = $.merge(data, this.params);

        this.ajax({
            url: '/v1/user/demo/deposit/',
            data: data,
            type: 'post'
        }).then(function(data) {
            data = data.data;


            var url = data.pay_url + '&' + data.post_data;

            new Charge(url, self.params.coin, self.params.amount);

        });
    },

    _getParams: function() {
        var activeEl = $('.J_Radio.active');
        var li = activeEl.parent('li');
        var index = li.index() - 1;
        var info = this.ratio[index];

        return {
            coin: info.coin,
            amount: info.amount
        };
    },

    _getData: function() {
        var self = this;

        this.ajax({
            url: '/v1/config',
            data: {
                access_token: this.cookie.get('token')
            }
        }).then(function(data) {
            var config = data.data.config;
            var coinPrice = config.coin_price.demo;

            self.ratio = coinPrice.ratio;

            self.render(tmpl, {
                ratio: coinPrice.ratio,
                phone: self.cookie.get('phone')
            }, $('.info'));
        })
    },
    _initAttrs: function() {
        var url = new Uri().getParam('src');

        if (url) {
            $('.go-back').attr('href', url);
        }
    },

    _requires: function() {
        // new CustomerService();

        $('header').sticky();
    }
});

new RechargeDemo();