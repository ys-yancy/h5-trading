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

    console.log($('#J_Chart').height())

    this.instance = new Highcharts.StockChart({
      chart: {
        renderTo: 'J_Chart',
        className: 'stock-chart-area',
        backgroundColor: 'transparent',
        reflow: true,
        pinchType: 'x',
        zoomType: '',
        panning: true,
        spacing: [10, 10, 10, 10],
        width: $(window).width(),
        height: parseFloat($('html').css('font-size')) * 10
          // width: $(window).width(),
          // height: 150
          // height: this.height
      },


      // rangeSelector: {
      //   selected: this.selectedIndex
      // },

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
      },
      plotOptions: {
        candlestick: {
          lineColor: '#27c1a7',
          upLineColor: '#f74b47',
          color: '#27c1a7',
          upColor: '#f74b47',
        }
      },

      // xAxis: {
      //   type: 'datetime',
      //   minRange: 3600 * 1000 * 5,
      //   maxRange: 3600 * 1000 * 10
      // },
      xAxis: {
        range: 6 * 3600 * 1000,
        labels: {
          style: {
            color: '#575D62'
          }
        }
      },

      yAxis: {
        labels: {
          style: {
            color: '#575D62'
          }
        }
        // gridLineColor: '#f60'
      },


      series: [{
        name: 'AAPL Stock Price',
        data: data,
        type: 'area',
        color: '#01bdf1',
        threshold: null,
        // pointInterval: 30 * 1000 * 60,
        // pointRange: 100,''
        tooltip: {
          valueDecimals: 2,
          backgroundColor: getChartUi().otherChartColor
        },
        marker: {
          enabled: true,
          radius: 3,
          fillColor: '#01bdf1'
        },
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
            [0, getChartUi().otherChartColor], //Highcharts.getOptions().colors[0]],
            [1, getChartUi().otherChartColor] //Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
          ]
        }
      }],
      tooltip: {
        useHTML: true,
        //xDateFormat: '%Y-%m-%d %H:%M:%S',
        formatter: function(e) {
          return '<p>' + this.points[0].point.y + '</p>'
        },

        backgroundColor: 'rgba(0,0,0,.5)',
        borderWidth: 0,
        borderRadius: 0,
        shadow: false,
        style: {
          color: '#fff',
          padding: 10,
          fontSize: '.6rem'
        }
      },
    });
  }

  addPoint(point) {
    var data = this.instance.series[0].data;
    var lastData = data[data.length - 1];
    var lastDate = new Date(lastData.category);
    var date = new Date(point[0]);


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
      point[0] = lastData[0];

      lastData.update(point, true);
    }

    function add(point) {
      try {
        this.instance.series[0].addPoint(point, false, true);
        this.instance.redraw();
      } catch (e) {

      }
    }
  }

  update(list) {
    // list = this._last(list);

    this.instance.series[0].setData(list);
    this.instance.hideLoading();
  }

  /**
   * kind: open 开仓价格 close 平仓价格
   *
   */
  addPlotLine(price, type) {

    // if (kind === 'open') {
    var plotLines = this.openPlotLine;
    plotLines.label.text = "开仓: " + price;

    if (type === 'stopLoss') {
      plotLines.id = 'stoploss';
      plotLines.label.text = '止损:' + price;
      plotLines.label.align = 'right';
      // plotLines.label.style.right = '20px';
    } else if (type === 'takeProfit') {
      plotLines.id = 'takeprofit';
      plotLines.label.text = '止盈:' + price;
      plotLines.label.align = 'center';
    }

    plotLines.value = price;

    this.instance.yAxis[0].addPlotLine(plotLines);
  }

  defaults() {
    return {
      openPlotLine: {
        id: 'openprice',
        value: 0,
        color: '#fff',
        dashStyle: 'shortdash',
        width: 1,
        label: {
          text: '',
          align: 'left',
          useHTML: true,
          style: {
            backgroundColor: 'rgba(81, 89, 129, .8)',
            color: '#fff',
            border: '1px solid #4b5276',
            '-webkitBorderRadius': '.05rem',
            borderRadius: '.05rem',
            fontSize: '.55rem',
            textAlign: 'center',
            paddingLeft: '.15rem',
            paddingRight: '.15rem',
            height: '.85rem',
            lineHeight: '.85rem',
            align: 'right'
          }
        }

        // position: absolute;
        // .top(122);
        // .left(24);
        // .width(154);
        // .height(34);
        // .line-height(32);
        // text-align: center;
        // border: 1px solid #4e557c;
        // .border-radius(2);
        // color: #c5c6d1;
        // .font-size(21);
        // background:;
      }
    }
  }


  _last(data) {

    return data;
  }
}