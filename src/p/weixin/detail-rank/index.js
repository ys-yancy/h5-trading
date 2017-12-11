"use strict";

require('../../../lib/zepto');
var PageBase = require('../../../app/page-base');
var Util = require('../../../app/util');
var InfinityScroll = require('../../../common/infinite-scroll/index');
var BottomBanner = require('../../../common/weixin-bottom-banner');
var TopSwitch = require('../../../common/top-switch');
var Header = require('../../../common/header');
var Uri = require('../../../app/uri');
var tmpl = require('./index.ejs');

class CategoryRank extends PageBase {
    constructor() {
        super();

        this._initAttrs();
        this._requires();
        this._initInfinite();
        this.configStatistics();
    }

    _requires() {
        // new Header();
        new BottomBanner({
            page: 'detail'
        });
        new TopSwitch();
        // 添加默认微信分享
        if (this.isWeixin()) {
          this.setupWeiXinShare('default_invite');
        }
    }

    _initAttrs() {
        var isDemo = this.isDemo();
        
        this.containerEl = $('#J_List');
        this.url = isDemo ? '/v1/rank/symbol_profit/demo/' : '/v1/rank/symbol_profit/real/';

        var params = new Uri().getParams();

        this.symbol = params.symbol;
        this.symbolName = params.symbolName;

        $('#J_Symbol').text(this.symbolName);
    }

    _initInfinite(date) {
        var count = 10;
        var params = {
            access_token: this.cookie.get('token'),
            start: 0,
            end: count
        };

        return new InfinityScroll({
            loadingConfig: {
                el: $('#J_Loading'),
                needInit: false,
            },
            params: params,
            el: this.containerEl,
            url: this.url,
            tmpl: tmpl,
            emptyTmpl: '<li class="empty">暂无推荐信息</li>',
            infinite: true,
            hideNoMore: true,
            beforeRequest: function(params) {
                return {
                    end: (params.page + 1) * count - 1,
                    start: params.page * count
                };
            },
            parse: function(data, params) {
                if (data && data.data) {
                    data = data.data;
                    var hasNextPage = true;

                    if (data.list.length === 0 || data.list.length < count) {
                        hasNextPage = false;
                    }

                    console.log(data)

                    return {
                        data: data.list,
                        hasNextPage: hasNextPage
                    }
                }

                return data;
            }
        });
    }
}

new CategoryRank();