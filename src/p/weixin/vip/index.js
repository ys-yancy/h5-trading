"use strict";

require('../../../lib/zepto');
var Header = require('../../../common/header');
var PageBase = require('../../../app/page-base');
var Util = require('../../../app/util');
var InfinityScroll = require('../../../common/infinite-scroll/index');
var tmpl = require('./index.ejs');


class Recommend extends PageBase {
    constructor() {
        super();

        this._login();
        this._requires();
        this._initAttrs();
        this._bind();
        this.configStatistics();

    }

    _bind() {
        var doc = $(document);

        doc.on('click', '.J_Order', $.proxy(this._order, this));
        doc.on('click', '.J_Login', $.proxy(this._login, this));

        doc.on('click', '#J_GoRegister', (e) => {
                $(e.currentTarget).attr('href', '../register.html?src=' + encodeURIComponent(location.href));
            })
            .on('click', '#J_GoGetPassWord', (e) => {
                $(e.currentTarget).attr('href', '../recovery-password.html?src=' + encodeURIComponent(location.href));
            });

        // 添加默认微信分享
        if (this.isWeixin()) {
          this.setupWeiXinShare('default_invite');
        }
    }

    _login() {
        this.login(true).then(() => {
            this.cookie.set('type', 'real');

            // this.getRealToken().then(() => {
            return this._getNetDeposit().then((netDeposit) => {
                if (netDeposit >= 5000) {
                    this._initInfinite();
                } else {
                    $('#J_List').html('<li class="less">VIP专享推荐，入金超过5000美元可用，<a href="../cs.html">详询客服</a></li>');
                    $('#J_Loading').hide();
                }
            });

            // this.setupWeiXinShare('recommend');
        }, () => {
            $('#J_Loading').hide();
            $('#J_List').html('<li class="login J_Login">请先登录</li>');
        });
    }

    _getNetDeposit() {
        var self = this,
            type = this.isDemo() ? 'demo' : 'real',
            typeTag = 'init-' + type;

        return this.getAccount().then((data) => {
            return data.account.real.net_deposit;
        });
        // .then((data) => {
        //     return this.getFloatingProfit(this.account, data.list, data.symbols)
        // }).then((profit, floatOption) => {
        //     var netDeposit = parseFloat(this.account[type].balance) + parseFloat(profit);

        //     return netDeposit;
        // });
    }

    _order(e) {
        var curEl = $(e.currentTarget);

        e.preventDefault();

        this.ajax({
            url: getWxTodayRecommendUrl(),
            type: 'post',
            data: {
                id: curEl.attr('data-id')
            },
            unjoin: true
        }).done(function() {
            location.href = curEl.attr('href');
        });
    }

    _requires() {
        new Header();
    }

    _initAttrs() {
        this.containerEl = $('#J_List');
        this.url = getWxTodayRed_vipUrl;
    }

    _initInfinite(date) {
        var count = 10;
        var params = {
            user_token: Cookie.get('token'),
            date: date || Util.getDate(),
            start: 0,
            end: count
        };

        return new InfinityScroll({
            loadingConfig: {
                el: $('#J_Loading'),
                needInit: false,
            },
            unjoin: true,
            params: params,
            el: this.containerEl,
            url: this.url,
            tmpl: tmpl,
            emptyTmpl: '<li class="empty">今日暂无推荐</li>',
            infinite: true,
            hideNoMore: true,
            beforeRequest: function(params) {

                return {
                    end: (params.page + 1) * count,
                    start: params.page * count
                };
            },
            parse: function(data, params) {
                if (data && data.data && data.data.data) {
                    data = data.data;
                    var hasNextPage = true;

                    if (data.data.length === 0 || data.data.length < count) {
                        hasNextPage = false;
                    }

                    data.data.router = encodeURIComponent(location.href);

                    return {
                        data: data.data,
                        hasNextPage: hasNextPage
                    }
                }

                if (data && data.data && data.data.data == null) {
                    return {
                        data: [],
                        hasNextPage: false
                    }
                }

                return data;
            }
        });
    }
}

new Recommend();