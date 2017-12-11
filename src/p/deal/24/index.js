"use strict";

require('../../../lib/zepto');
var PageBase = require('../../../app/page-base');
var Uri = require('../../../app/uri');
var Util = require('../../../app/util');

class Investment24 extends PageBase {
  constructor() {
    super();

    if (Cookie.get('phone') && Cookie.get('token')) {
      window.location = '../option.html';
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
    } else {
      this.token = '1b206283-5ab6-4849-b9e2-56e2cf607966';
    }

    // this.getToken().then(() => {
    this._initAttrs();
    this._getSymbol();
    this._bind();
    this._configShare();
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

    this.nextHref = './pro-trading.html?btntext=' + btnText + '&symbol=' + this.symbol + '&unit=' + this.unit + '&stopLossInPip=' + this.stopLossInPip + '&takeProfitInPip=' + this.takeProfitInPip + '&cmd=' + this.cmd + '&deal=investnow&volume=' + this.volume + (this.referCode ? '&refer=' + this.referCode : '');

    doc.on('tap', '.invest', (e) => {
      this._invest(e);
    });

    doc.on('tap', '.J_Item', (e) => {
      var curEl = $(e.currentTarget);
      var index = curEl.index();

      if (curEl.hasClass('on')) {
        return;
      }

      curEl.addClass('on');
      curEl.siblings().removeClass('on');
      this.selectedIndex = index;
      var symbolObj = this.symbols[index];

      if (!symbolObj.ready) {
        this._getSymbol(symbolObj.symbol);
      }
    });

  }

  _configShare() {
    if (this.isWeixin()) {
      // 使用之前邀请人的链接转发邀请
      this.setupWeiXinShare('origin_share');
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
    // this.getToken().then(() => {
    // window.location = this.nextHref;
    // });
    var index = this.selectedIndex || 0;
    var symbolObj = this.symbols[index];

    if (symbolObj.ready) {
      window.location = symbolObj.value;
    } else {
      this._getSymbol(symbolObj.symbol).then(() => {
        window.location = symbolObj.value;
      });
    }
  }

  _initAttrs() {
    var params = new Uri().getParams();

    this.symbol = params.symbol || 'USDCNH'; // 'EURUSD'; 
    this.stopLossInPip = params.stopLossInPip || 50;
    this.takeProfitInPip = params.takeProfitInPip || 25;
    this.cmd = params.cmd || '';
    this.volume = params.volume || '0.01';
    this.unit = params.unit || '0.00001';

    this.symbols = [{
      symbol: 'USDCNH',
      value: './pro-trading.html?btntext=' + btnText + '&symbol=USDCNH&unit=0.00001&stopLossInPip=' + this.stopLossInPip + '&takeProfitInPip=' + this.takeProfitInPip + '&cmd=' + this.cmd + '&deal=investnow&volume=' + this.volume + (this.referCode ? '&refer=' + this.referCode : '')
    }, {
      symbol: 'EURUSD',
      value: './pro-trading.html?btntext=' + btnText + '&symbol=EURUSD&unit=0.00001&stopLossInPip=' + this.stopLossInPip + '&takeProfitInPip=' + this.takeProfitInPip + '&cmd=' + this.cmd + '&deal=investnow&volume=' + this.volume + (this.referCode ? '&refer=' + this.referCode : '')
    }, {
      symbol: 'XTIUSD',
      value: './pro-trading.html?btntext=' + btnText + '&symbol=XTIUSD&unit=0.01&stopLossInPip=' + this.stopLossInPip + '&takeProfitInPip=' + this.takeProfitInPip + '&cmd=' + this.cmd + '&deal=investnow&volume=' + this.volume + (this.referCode ? '&refer=' + this.referCode : '')
    }];
  }

  _getSymbolObj(symbol) {
    var obj;
    this.symbols.forEach((item) => {
      if (item.symbol === symbol) {
        obj = item;
      }
    });

    return obj;
  }

  _getSymbol(symbol) {
    var type = this.cookie.get('type');
    type = type ? type : 'demo';

    return this.ajax({
      url: '/v3/' + type + '/symbols6/',
      data: {
        symbols: symbol || this.symbol,
        access_token: this.token
      }
    }).then((data) => {
      data = data.data[0];
      var symbolObj = this._getSymbolObj(symbol || this.symbol);
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

        symbolObj.value += '&src=' + encodeURIComponent(location.href) + '&takeprofit=' + this.takeprofit + '&stoploss=' + this.stoploss;
      }
      // 不锁定交易按钮 this.cmd === ''
      else {
        symbolObj.value += '&src=' + encodeURIComponent(location.href);
      }

      symbolObj.ready = true;
    });
  }
}

new Investment24();