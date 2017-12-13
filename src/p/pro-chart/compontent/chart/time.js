'use strict';

var ChartArea = require('../../../../common/chart/intraday2');
var PageBase = require('../../../../app/page-base');
var Util = require('../../../../app/util');
var Base = require('../../../../app/base');
var Config = require('../../../../app/config');

export default class Chart extends Base {
  constructor(config) {
    super(config);

    this._bind();
    this._initChart();
  }

  _bind() {
    var doc = $(document);

    this.subscribe('update:chart', (priceInfo) => {
      priceInfo && this.shouldChartUpdate(priceInfo);
    });
  }

  _selectRange(e) {
    var curEl = $(e.currentTarget),
      index = curEl.index(),
      buttonEls = document.getElementsByClassName('highcharts-button'),
      buttonEl = $(buttonEls[index]);

    var types = this.types;
    var type = types[index];

    if (curEl.hasClass('active')) {
      return;
    }


    this.chartInstance && this.chartInstance.showLoading();
    curEl.addClass('active');
    curEl.siblings().removeClass('active');
  }

  _initChart() {
    this._getCandle('m1', false, 'area');
  }

  change(symbol, askPrice, bidPrice) {
    this.symbol = symbol;

    this._getCandle('m1', false, 'area');

    $('.range-selector', this.el).removeClass('active');
    $($('.range-selector', this.el)[0]).addClass('active');
  }

  _getCandle(type, refresh, chartType, selectedIndex) {
    var self = this;

    this.chartType = chartType;

    if (type) {
      this.candleType = type;
      this.chartType = chartType;
    } else {
      type = this.candleType;
      chartType = chartType;
    }

    var map = {
      m1: 60,
      m5: 5 * 60,
      m15: 15 * 60,
      m30: 30 * 60,
      h1: 60 * 60,
      d1: 24 * 60 * 60
    };

    this.ajax({
      url: this.candleUrl,
      dateType: 'jsonp',
      data: {
        id: this.symbol,
        //start_time: Util.formateTime((this.startTime || Date.now()) - (map[type] * 1000 * 50), "yyyy-MM-dd HH:mm:ss"),
        tf: type,
        group_name: Cookie.get('type') == 'real' ? Cookie.get('real_group') : Cookie.get('demo_group')
      },
      unjoin: true,
    }).then((data) => {
      //x,open,high,low,close

      data = data.data;

      // var unit = this.unit.toString().split('.')[1].length;

      var list = [];
      for (var i = data.price.length - 1, count = 0; i > 0; i--) {
        var item = data.price[i];
        ++count;

        if (chartType === 'area') {
          list.push([
            Util.getTime(item.beijing_time),
            parseFloat(((item.open + item.close) / 2).toFixed(this.unit))
          ]);
        } else {
          list.push([
            Util.getTime(item.beijing_time),
            item.open,
            item.high,
            item.low,
            item.close
          ]);

          if (count > 50) {
            break;
          }
        }

      }
      list = list.sort(function(a, b) {
        return a[0] > b[0] ? 1 : -1;
      });

      this.lastData = list[list.length - 1];

      if (this.chart) {
        try {
          // var chart = self.chartInstance;
          this.chart.update(list);
          this.chart.selectedIndex = selectedIndex;

          if (refresh && self.curState == 'close') {
            this.refresh = false;
            this._getData();
          }
        } catch (e) {}

        return;
      }

      // create the chart
      this.chart = new ChartArea({
        data: list,
        // price: self.price,
        up: false,
        stockName: self.name,
        selectedIndex: self.types.indexOf(type),
        renderTo: 'J_TimeChart',
        backgroundColor: '#fff',
        startColor: '#d2c2f0',
        endColor: '#fff'
      });
      this.type = 'up';
      this.chartInstance = self.chart.instance;
    });
  }

  shouldChartUpdate(priceInfo) {
    var type = this.candleType;

    var curPrice = parseFloat(priceInfo.bidPrice);

    this.lastData[0] = Date.now();
    this.lastData[1] = curPrice;
  
    var data = this.chart.addPoint(this.lastData);

    return;
  }

  addPoint(point) {
    this.chart && this.chart.addPoint(point);
  }

  defaults() {
    return {
      types: ['m1', 'm5', 'm15', 'm30', 'h1', 'd1']
    };
  }
}
