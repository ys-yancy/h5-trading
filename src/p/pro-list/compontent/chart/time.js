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

    this.subscribe('update:chart:seriess', (list) => {
      list && this._setSeriesData(list);
    });

    this.subscribe('update:chart', (priceInfo) => {
      priceInfo && this.shouldChartUpdate(priceInfo);
    });
  }

  _initChart() {
    this._getCandle('m1', false, 'area');
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
    console.log()
    this.lastData = this.list[this.list.length - 1];

    // create the chart
    this.chart = new ChartArea({
      data: this.list,
      price: self.price,
      up: false,
      stockName: self.name,
      selectedIndex: self.selectedIndex,
      renderTo: 'J_TimeChart',
      backgroundColor: '#fff',
      startColor: '#d2c2f0',
      endColor: '#fff'
    });

    this.type = 'up';
    this.chartInstance = self.chart.instance;
  }

  _setSeriesData(data) {
    var chart = this.chartInstance;
    this.chartData = data.list;
    this.lastData = data.list[data.list.length - 1];
    try {
      if (this.chart) {
        chart.series[0].setData(data.list, true, false, false);
        this.chart.selectedIndex = data.selectedIndex;
      }
    } catch (e) {}
  }

  shouldChartUpdate(priceInfo) {
    var type = this.candleType;

    var curPrice = parseFloat(priceInfo.bidPrice);

    var lastData = [];
    lastData[0] = Date.now();
    lastData[1] = curPrice;

    // this.lastData[0] = Date.now();
    // this.lastData[1] = curPrice;

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
