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
        this._requires();
        this._initAttrs();

        this.getToken().then(function() {
            this._initInfinite();
        }.bind(this));
        this._bind();

        this.configStatistics();

        this.setupWeiXinShare('recommend');
    }

    _bind() {
        var doc = $(document);

        doc.on('click', '.J_Order', $.proxy(this._order, this));

        // 添加默认微信分享
        if (this.isWeixin()) {
          this.setupWeiXinShare('default_invite');
        }
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
        this.url = '//weixin.invhero.com/api/today_recommend';
    }

    _initInfinite(date) {
        var count = 100;
        var params = {
            access_token: Cookie.get('token'),
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

                    if (data.data.length > 0) {
                        $('#J_Desc').show();
                    }

                    data.data.router = encodeURIComponent(location.href);

                    return {
                        data: data.data,
                        hasNextPage: hasNextPage
                    }
                }

                return data;
            }
        });
    }
}

new Recommend();