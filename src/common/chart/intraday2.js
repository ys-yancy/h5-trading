// $(function() {
//     $.getJSON('http://www.highcharts.com/samples/data/jsonp.php?filename=aapl-c.json&callback=?', function(data) {

'use strict';

var Base = require('../../app/base');
var Util = require('../../app/util');


export default class ChartArea extends Base {
  constructor(config) {
    super(config);
    this._initChart();
  }

  _initChart() {
    var data = this.data;
    this.instance = new Highcharts.StockChart({
      chart: {
        renderTo: this.renderTo,
        className: 'stock-chart-area',
        backgroundColor: '#fff',
        height: '30%'
      },

      xAxis: {
        crosshair: false,
        gridLineColor: '#F5F5F5',
        endOnTick: false,
        gridLineWidth: 0,
        minRange: 3600 * 1000 * 24 * 50,
        labels: {
          enabled: false
        }
      },

      yAxis: {
        gridLineColor: '#F5F5F5',
        endOnTick: false,
        gridLineWidth: 1,
        labels: {
          enabled: false,
          style: {
            fontSize: '18px',
          }
        }
      },

      rangeSelector: {
        buttons: [{
          type: 'minute',
          count: 1,
          text: '1M'
        }, {
          type: 'minute',
          count: 5,
          text: '5M'
        }, {
          type: 'minute',
          count: 15,
          text: '15M'
        }, {
          type: 'minute',
          count: 30,
          text: '30M'
        }, {
          type: 'hour',
          count: 1,
          text: '1h'
        }, {
          type: 'day',
          count: 1,
          text: '1D'
        }, {
          type: 'all',
          count: 1,
          text: 'All'
        }],
        gapSize: 100,
        selected: this.selectedIndex,
        buttonTheme: {
          style: {
            display: 'none',
          }
        }
      },

      title: {
        style: {
          display: 'none'
        }
      },

      credits: {
        enabled: false
      },
      exporting: {
        enabled: false
      },
      navigator: {
        enabled: false
      },
      scrollbar: {
        enabled: false,
        liveRedraw: false
      },
      series: [{
        name: 'AAPL Stock Price',
        data: data,
        type: 'area',
        color: '#F7CB38',
        threshold: null,
        // tickPixelInterval: 100,
        fillColor: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1
          },
          stops: [
            [0, '#fff'],
            [1, '#fff']
          ]
        }
      }],
      tooltip: {
        enabled: false,
        useHTML: true,
        formatter: function(e) {
          return '<p>' + this.points[0].point.y + '</p>'
        },

        backgroundColor: '#dc9702',
        style: {
          color: '#fff',
          fontSize: '.55rem'
        },
        borderRadius: 4,
        borderWidth: 0
      },
    });
  }

  addPoint(point) {
    var self = this;
    var data = this.instance.series[0].data;
    var lastData = data[data.length - 1];
    var lastDate = new Date(lastData.category);
    var date = new Date(point[0]);
    var now = Date.now();

    this.prevTime = now;

    switch (this.selectedIndex) {
      case 0:
        if (date.getMinutes() === lastDate.getMinutes()) {
          update();
        } else {
          add();
        }
        break;
      case 1:
        if (date.getHours() === lastDate.getHours()) {
          if (date.getMinutes() - lastDate.getMinutes() >= 5) {
            add();
          } else {
            update();
          }
        } else {
          add();
        }
        break;
      default:
        update();
    }

    function update() {
      point[0] = lastData.x;

      lastData.update(point, true);
    }

    function add() {
      console.log('add', new Date().getMinutes())
      try {
        self.instance.series[0].addPoint(point);
        self.instance.redraw();
      } catch (e) {
        console.log(e);

      }
    }
  }

  update(list) {
    this.instance.series[0].setData(list, true);
    this.instance.hideLoading();
  }

  _last(data) {
  return data;
  }
}
