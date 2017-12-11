'use strict';

var PageBase = require('../../../../app/page-base');
var Util = require('../../../../app/util');
var CandleChart = require('../../../../common/chart/new');
var CandleRefresh = require('../../../../common/candle-refresh');

@Util.mixin(CandleRefresh)
export default class Chart extends PageBase {
  constructor(config) {
    super(config);

    this._getCandle('m5');
    this._bind();
  }

  _bind() {
    this.el.on('click', '.range-selector', $.proxy(this._selectRange, this));

    this.subscribe('update:chart', (priceInfo) => {
      var up = priceInfo.askPrice / 2 + priceInfo.bidPrice / 2 - this.getClose() > 0 ? true : false;

      this.chart && this.chart.updatePlotLine(priceInfo.bidPrice, up, this.chartInstance);

      priceInfo && this.shouldChartUpdate(priceInfo);

      var curPrice = parseFloat(priceInfo.bidPrice);

      this.lastData[0] = Date.now();
      this.lastData[2] = this.lastData[2] < curPrice ? curPrice : this.lastData[2];
      this.lastData[3] = this.lastData[3] > curPrice ? curPrice : this.lastData[3];
      this.lastData[4] = curPrice;

      this.chart.addPoint(this.lastData);
    });


    this.subscribe('addpoint:chart', (lastData) => {
      this.chart.addPoint(lastData);
    });

    this.subscribe('switch:symbol', (e) => {
      if (e.symbol !== this.symbol) {
        // this.chart = null;
        // $('#J_Chart').html('')
        this.change(e.symbol);
      }
    });
  }

  change(symbol, askPrice, bidPrice) {
    this.symbol = symbol;

    this._getCandle('m5', true).then(() => {
      var up = askPrice / 2 + bidPrice / 2 - this.getClose() > 0 ? true : false;
      this.chart && this.chart.updatePlotLine(bidPrice, up, this.chartInstance);
    });

    $('.range-selector', this.el).removeClass('active');
    $($('.range-selector', this.el)[0]).addClass('active');


  }

  _selectRange(e) {
    var curEl = $(e.currentTarget),
      index = curEl.index(),
      buttonEls = document.getElementsByClassName('highcharts-button'),
      buttonEl = $(buttonEls[index]);
    if (curEl.hasClass('active') || index === 0) {
      return;
    }



    var types = this.types;
    var type = types[index - 1];

    try {
      this.chartInstance && this.chartInstance.showLoading();
    } catch (e) {
      console.log(e);
      this.chart = null;
    }
    this._getCandle(type, true);

    // if (this.chart) {
    //   this.chart.selectedIndex = index;
    // }

    curEl.addClass('active');
    curEl.siblings().removeClass('active');
  }

  _getCandle(type, refresh) {
    var self = this;

    if (type === 'up') {
      // debugger
    }
    if (type) {
      this.candleType = type;
    } else {
      type = this.candleType;
    }

    var map = {
      m1: 60,
      m5: 5 * 60,
      m15: 15 * 60,
      m30: 30 * 60,
      h1: 60 * 60,
      // d1: 24 * 60 * 60
    };

    var indexMap = {
      m1: 0,
      m5: 1,
      m15: 2,
      m30: 3,
      h1: 4,
      // d1: 5
    };

    return this.ajax({
      url: this.candleUrl,
      dateType: 'jsonp',
      data: {
        id: this.symbol,
        //start_time: Util.formateTime((this.startTime || Date.now()) - (map[type] * 1000 * 50), "yyyy-MM-dd HH:mm:ss"),
        tf: type,
        group_name: Cookie.get('type') == 'real' ? Cookie.get('real_group') : Cookie.get('demo_group')
      },
      unjoin: true,
    }).then(function(data) {
      //x,open,high,low,close
      // self.chartData = data

      data = data.data;

      var list = [];
      for (var i = data.price.length - 1, count = 0; i > 0; i--) {
        var item = data.price[i];
        ++count;
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
      list = list.sort(function(a, b) {
        return a[0] > b[0] ? 1 : -1;
      });

      self.chartData = list;
      // list = list.slice()
      // if (list.length <= 50) {
      //   list = list;
      // } else {
      //   list = list.slice(list.length - 50);
      // }


      self.lastData = list[list.length - 1];


      if (self.chart) {
        try {
          var chart = self.chartInstance;

          chart.series[0].setData(list);
          chart.hideLoading();
          self.chart.selectedIndex = indexMap[type];

          if (refresh && self.curState == 'close') {
            self.refresh = false;
            // self._getData();
          }
        } catch (e) {}

        return;
      }

      // create the chart
      self.chart = new CandleChart({
        data: list,
        price: self.price,
        up: false,
        stockName: self.name,
        selectedIndex: self.types.indexOf(type)
      });
      self.type = 'up';
      self.chartInstance = self.chart.getInstance();

      self.chart.updatePlotLine(self.bidPrice, self.up);
    });
  }

  getClose() {
    if (this.symbol === 'XTICNH') {
      return this.parent.oilClosePrice;
    } else {
      return this.parent.sliverClosePrice;
    }
  }

  defaults() {
    return {
      symbol: 'XTICNH',
      types: ['m1', 'm5', 'm15', 'm30', 'h1'] //['m1', 'm5', 'm15', 'm30', 'h1', 'd1']
    };
  }
}
