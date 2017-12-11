'use strict';

var Base = require('../../app/page-base');
var Uri = require('../../app/uri');
var BottomAccount = require('../../common/bottom-account/data');
var Chart = require('./component/chart');
var TimeChart = require('./component/chart/time');
var Order = require('./component/order');
var OptionBanner = require('./component/option-banner');

var Progress = require('./component/progress/index');
var Check = require('../../common/check');

class Rapid extends Base {
  constructor() {

    super();

    this.configStatistics();
    this._response();

    this.login().then(() => {
      this.bottomAccount = new BottomAccount({
        filterUI: 6,
        filterList: this.currentOrderList,
        props: this
      });
      this.query = new Uri().getParams();
      this.symbol = this.query.symbol;
      $('#J_Title').text(this.query.name);

      if (this.isDemo()) {
        $('.footer .tag').text('模拟');
      }
      else {
        $('.footer .tag').text('实盘');
      }

      // this.getMargin(openPrice, symbol, volume, account) {

      new Check();
      var unit;
      var query = this.query;
      try {
        unit = query.unit.split('.')[1].length;
      } catch (e) {
        unit = 2;
      }
      this.unitQuote = unit;
      this.getSymbolValue().then(() => {
        this._bind();
        this.order = new Order({
          props: this,
          bottomAccount: this.bottomAccount
        });
        this.timeChart = new TimeChart({
          el: $('#J_ChartWrapper'),
          parent: this,
          symbol: this.query.symbol,
          unit: unit
        });
      });

      
    });

    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('rapid');
    }
  }

  _bind() {
    this.subscribe('account:did:update', (e) => {
      $('.J_NetDeposit').text(e.netDeposit.toFixed(2) + '' || '--');
      if (!this.accountData) {
        this.progress = new Progress({ freeMargin: e.freeMargin });
        this.optionBanner = new OptionBanner({
          props: this,
          el: $('#J_OptionBanner'),
          bottomAccount: this.bottomAccount
        });
      }
      this.accountData = e;

      $('.J_Float').text(e.profit.toFixed(2) || 0);

      parseFloat($('.J_Float').text()) > 0 ? $('.J_Float').addClass('up') : $('.J_Float').removeClass('up');
      //e.profit ? $('.J_Float').addClass('up') : $('.J_Float').removeClass('up');
      $('.J_Count').text(e.list.length);



      var total = 0; // 盈亏


      if (e.list.length) {
        $.each(e.list, function(index, item) {
          total += parseFloat(item.profit) + parseFloat(item.swap) - parseFloat(item.commission);
        });
      }

      this.accountData.total = total;

      this.optionBanner && this.optionBanner.fresh(e.list);

    });

    this.subscribe('stomp:price:update', (e) => {

      if (this.query.symbol === e.symbol) {
        this.broadcast('update:chart', e);
        this.priceInfo = e;
        this.askPrice = e.askPrice;
        this.bidPrice = e.bidPrice;

        $('#J_CurPrice').text(this.bidPrice);

        this.chart && this.chart.updatePlotLine(this.bidPrice, this.bidPrice - this.closePrice);

        // this.timeChart && this.timeChart.shouldChartUpdate(priceInfo);

      }
    }, this);

    $('.range-selector').on('click', (e) => {
      var curEl = $(e.currentTarget);
      var index = curEl.index();

      if (curEl.hasClass('active')) {
        return;
      }

      if (index === 0) {
        curEl.addClass('active');
        curEl.siblings().removeClass('active');
      }

      if (this.prevIndex !== 0 && index > 0) {
        this.prevIndex = index;
        return;
      }

      this.prevIndex = index;


      if (index === 0) {

        $('#J_TimeChart').show();
        $('#J_Chart').hide();

        this.timeChart = new TimeChart({ el: $('#J_ChartWrapper'), parent: this, symbol: this.query.symbol, unit: this.unitQuote });
      } else {
        $('#J_TimeChart').hide();
        $('#J_Chart').show();


        var up = this.bidPrice - this.closePrice > 0 ? true : false;

        this.chart = new Chart({
          el: $('#J_ChartWrapper'),
          parent: this,
          symbol: this.query.symbol,
          unit: 2,
          bidPrice: this.bidPrice,
          up: up
        });
      }
    });
  }

  getSymbolValue() {
    var type = this.isDemo() ? 'demo' : 'real';

    return this.ajax({
      url: '/v3/' + type + '/symbols6/',
      data: {
        symbols: this.query.symbol,
        access_token: this.cookie.get('token')
      }
    }).then((data) => {
      data = data.data[0];
      this.symbolValue = data;
      this.unit = data.policy.min_quote_unit;

      this.askPrice = data.quote.ask_price[0];
      this.bidPrice = data.quote.bid_price[0];
      this.closePrice = data.close_price;

      this.name = data.policy.name;

      this.defaultTakeprofit = data.policy.default_takeprofit;

      // var leverage = self._getLeverage(data, self.account);
      // data.leverage = leverage;
      // self.attribute = new Attribute(data);

    });
  }


  _response() {
    var contentEl = $('.content');
    var winHeight = $(window).height();
    var headerHeight = $('header').height();
    var footerHeight = $('footer').height();
    var charHeight = $('#J_ChartWrapper').height();
    var accountHeight = $('.account-wrapper').height();
    var orderHeight = $('.order-wrapper').height();
    var fixHeight = $('.fix').height();

    if (winHeight - headerHeight - footerHeight - charHeight - accountHeight - orderHeight - fixHeight > 0) {
      $('body').css({ overflow: 'hidden' })
    }
  }

  defaults() {
    return {
      prevIndex: 0,
      currentOrderList: []
    };
  }
}

new Rapid();
