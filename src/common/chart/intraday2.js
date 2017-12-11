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

    // data = this._last(data);
    this.instance = new Highcharts.StockChart({
      chart: {
        renderTo: this.renderTo || 'J_Chart', /*this.renderTo || 'J_Chart'*/
        className: 'stock-chart-area',
        backgroundColor: '#150d22',
        reflow: true,
        pinchType: 'x',
        zoomType: '',
        panning: true
      },

      xAxis: {
        // gridLineColor: '#20182d',
        // gridLineWidth: 1,

        // type: 'datetime',
        // max: Date.now() + 3600 * 1000
        minRange: 3600 * 1000 * 24 * 50
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
        selected: this.selectedIndex
      },

      title: {
        style: {
          display: 'none'
        }
      },
      colors: ['#2dcea4'],

      credits: {
        enabled: false
      },
      exporting: {
        enabled: false
      },
      navigator: {
        enabled: false
          // series: {
          //     data: data
          // },
          // adaptToUpdatedData: false
      },
      plotOptions: {
        candlestick: {
          lineColor: '#27c1a7',
          upLineColor: '#f74b47',
          color: '#27c1a7',
          upColor: '#f74b47',
        }
      },
      series: [{
        name: 'AAPL Stock Price',
        data: data,
        type: 'area',
        color: '#e4b52b',
        threshold: null,
        tooltip: {
          valueDecimals: 2,
          backgroundColor: '#dc9702'
        },
        tickPixelInterval: 100,
        // dataLabels: {
        //     enabled: true,
        //     borderRadius: 5,
        //     backgroundColor: 'rgba(252, 255, 197, 0.7)',
        //     borderWidth: 1,
        //     borderColor: '#AAA',
        //     y: -6
        // },
        fillColor: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1
          },
          stops: [
            [0, '#2a155c'], //Highcharts.getOptions().colors[0]],
            [1, '#160e23'] //Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
          ]
        }
      }],
      tooltip: {
        useHTML: true,
        //xDateFormat: '%Y-%m-%d %H:%M:%S',
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

    // if (now - this.prevTime < 1000) {
    //   return;
    // }

    // self.count = self.count || 1;
    // self.count++;


    this.prevTime = now;

    // console.log(data.length, date.getMinutes(), lastDate.getMinutes())

    // if (self.count % 20 !== 1) {
    //   return;
    // }
    // point[0] = lastData.category + 5 * 60 * 1000;
    // add();
    // return;
    // // console.log(1);
    // // }

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

      // console.log(lastData.y, point[1])
      lastData.update(point, true);
    }

    function add() {
      console.log('add', new Date().getMinutes())
        // if (self.selectedIndex == 0 && data.length !== 99) {
        //   // console.log(data.length)
        //   return;
        //   // $('.range-selector.active').trigger('tap');
        // }
      try {
        self.instance.series[0].addPoint(point);
        self.instance.redraw();
      } catch (e) {
        console.log(e);

      }
    }

    // window._add = function(data) {
    //   add(data);
    // }

    // function update() {
    //   lastData.update(point);
    // }

    // function add() {
    //   // [x, open, high, low, close]
    //   var newPoint = [point];
    //   try {
    //     self.instance.get('dataseries').addPoint(point, false, true);
    //     self.instance.redraw();

    //     return newPoint;
    //   } catch (e) {
    //     console.log(e);

    //   }
    // }
  }

  update(list) {
    // list = this._last(list);

    this.instance.series[0].setData(list);
    this.instance.hideLoading();
  }

  _last(data) {
    // var last = data[data.length - 1];

    // data[data.length - 1] = {
    //     dataLabels: {
    //         enabled: true,
    //         align: 'right',
    //         style: {
    //             fontWeight: 'bold'
    //         },
    //         color: '#fff',
    //         backgroundColor: 'rgba(207,151,2, .6)',
    //         verticalAlign: 'middle',
    //         overflow: true,
    //         crop: false,
    //         borderWidth: 2,
    //         padding: 5,
    //         textShadow: 'none'

    //     },
    //     x: last[0],
    //     y: last[1]
    // };

    return data;
  }
}
