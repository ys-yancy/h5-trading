"use strict";

require('../../../lib/zepto');
var PageBase = require('../../../app/page-base');
var Uri = require('../../../app/uri');
var Util = require('../../../app/util');


class Investment extends PageBase {
    constructor() {
        super();


        // 跟踪ID
        Cookie.set('invhero_track_id', Util.guid());

        if (Cookie.get('phone') && Cookie.get('token')) {
            // window.location = window.location.origin + '/s/option.html';

            // 直接去option页面
            var wl = window.location.pathname.substring(0, window.location.pathname.indexOf('/s/'));
            window.location = window.location.origin + wl + '/s/option.html';
        }

        var params = new Uri().getParams();
        // 记录用户来源, 优先取微信的from, 其次是我们自己定的source
        this.source = params.from ? params.from : params.source;
        if (!Cookie.get('source') && this.source) {
            Cookie.set('source', this.source);
        }
        // 获取邀请码
        this.referCode = new Uri().getNextPath('i/', 6);
        // console.log("referCode= " + this.referCode);
        Cookie.set('referCode', this.referCode);


        if (location.href.indexOf('waibao') != -1 || location.href.indexOf('localhost') != -1) {
            this.token = 'token4';
        }
        else {
            this.token = '1b206283-5ab6-4849-b9e2-56e2cf607966';
        }

        
        // this.getToken().then(() => {
            this._initAttrs();
            this._getSymbol();
            this._bind();
            this.configStatistics();
        // });   
    }

    _bind() {
        var doc = $(document);

        doc.on('tap', '.J_Detail', (e) => {
            this._detail(e);
        });

        doc.on('tap', '.J_DialogClose', (e) => {
            this._close(e);
        });
        this.nextHref = '../pro-trading.html?symbol=' + this.symbol + '&unit=' + this.unit + '&stopLossInPip=' + this.stopLossInPip + '&takeProfitInPip=' + this.takeProfitInPip + '&cmd=' + this.cmd + '&deal=investnow&volume=' + this.volume + (this.referCode ? '&refer=' + this.referCode : '');

        doc.on('tap', '.invest', (e) => {
            this._invest(e);
        });

        // 添加默认微信分享
        if (this.isWeixin()) {
          this.setupWeiXinShare('default_invite');
        }
    }

    _detail() {
        $('#J_DialogInvest').show();
        $('#J_DialogInvestMask').show();
    }

    _close() {
        $('#J_DialogInvest').hide();
        $('#J_DialogInvestMask').hide();
    }

    _invest() {
        this.getToken().then(() => {
            window.location = this.nextHref;
        });
    }

    _initAttrs() {
        var params = new Uri().getParams();

        this.symbol =  params.symbol || 'EURUSD'; // 'EURUSD'; 
        this.stopLossInPip = params.stopLossInPip || 50;
        this.takeProfitInPip = params.takeProfitInPip || 25;
        this.cmd = params.cmd || '';
        this.volume = params.volume || '0.01';
        this.unit = params.unit || '0.00001';
    }

    _getSymbol() {
        var type = this.cookie.get('type');
        type = type ? type : 'demo';

        this.ajax({
            url: '/v3/' + type + '/symbols6/',
            data: {
                symbols: this.symbol,
                access_token: this.token
            }
        }).then((data) => {
            data = data.data[0];
            if (this.cmd != '') {
                var price = this.cmd === 'buy' ? data.quote.ask_price[0] : data.quote.bid_price[0];
                price = parseFloat(price);

                this.takeprofit = this.cmd === 'buy' ? price + this.takeProfitInPip * data.policy.pip : price - this.takeProfitInPip * data.policy.pip;
                this.stoploss = this.cmd === 'buy' ? price - this.stopLossInPip * data.policy.pip : price + this.stopLossInPip * data.policy.pip;

                // this.takeprofit = price + this.takeProfitInPip * data.policy.min_quote_unit;
                // this.stoploss = price - this.stopLossInPip * data.policy.min_quote_unit;
                var fix = data.policy.min_quote_unit.toString().length - 2;
                this.takeprofit = this.takeprofit.toFixed(fix);
                this.stoploss = this.stoploss.toFixed(fix);

                this.nextHref += '&src=' + encodeURIComponent(location.href) + '&takeprofit=' + this.takeprofit + '&stoploss=' + this.stoploss;
            }
            // 不锁定交易按钮 this.cmd === ''
            else {
                this.nextHref += '&src=' + encodeURIComponent(location.href);
            }
        });
    }
}

new Investment();