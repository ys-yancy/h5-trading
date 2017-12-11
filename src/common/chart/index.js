"use strict";

require('./index.css');
var Base = require('../../app/base');
var Util = require('../../app/util');

function Chart() {
  Chart.superclass.constructor.apply(this, arguments);
  this.ui = getChartUi();
  this.init();
}

Base.extend(Chart, Base, {
  init: function() {
    this._initHightStock();
  },

  getInstance: function() {
    return this.instance;
  },

  _initHightStock: function() {
    var data = this.data,
      stockName = this.stockName || '',
      downPrice = this.downPrice,
      downPriceTxt = this.downPriceTxt || downPrice,
      upPrice = this.upPrice,
      upPriceTxt = this.upPriceTxt || upPrice,
      afterSetExtremes = this.afterSetExtremes || function() {};
    var plotLines, price = this.price;
    var self = this;
    var width = this.width;
    if (this.up) {
      plotLines = this.upPlotLine;
    } else {
      plotLines = this.downPlotLine;
    }

    this.plotLinesId = plotLines.id;

    plotLines.value = price;
    plotLines.label.text = price;

    this.instance = new Highcharts.StockChart({
      chart: {
        renderTo: 'J_Chart',
        className: 'stock-chart',
        backgroundColor: self.ui.background || '#fff',
        height: width || '100%',

        events: {
          redraw: function(event) {
            if (this.xAxis) {
              var extremes = this.xAxis[0].getExtremes();
              if (extremes && extremes.min == extremes.dataMin) {
                console.log("time to load more data!");
                // self.broadcast('chart:loadmore');
              }
            }
          }
        }

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
      },

      scrollbar: {
        enabled: false,
        liveRedraw: false
      },

      rangeSelector: {
        buttons: [
          {
            type: 'minute',
            count: 1,
            text: '1M'
          },
          {
            type: 'minute',
            count: 5,
            text: '5M'
          },
          {
            type: 'minute',
            count: 15,
            text: '15M'
          },
          {
            type: 'minute',
            count: 30,
            text: '30M'
          },
          {
            type: 'hour',
            count: 1,
            text: '1h'
          },
          {
            type: 'day',
            count: 1,
            text: '1D'
          },
          {
            type: 'all',
            count: 1,
            text: 'All'
          }
        ],
        selected: this.selectedIndex,
        buttonSpacing: 0,
        inputEnabled: false,
        buttonTheme: {
          fill: '#1c2230',
          stroke: 'none',
          width: 100,
          'stroke-width': 0,
          r: 0,
          style: {
            display: 'none',
            color: '#807691',
            fontWeight: 'bold',
            fontSize: '.3rem'
          },
          states: {
            select: {
              fill: '#1b5f5e',
              style: {
                color: 'white'
              }
            }
          }
        },
        inputBoxBorderColor: 'gray',
        labelStyle: {
            color: 'red',
            fontWeight: 'bold',
            display: 'none'
        },
      },

      plotOptions: {
        candlestick: {
          lineColor: this.ui.downColor || '#5C9F34',
          upLineColor: this.ui.upColor || '#F64843',
          color: this.ui.downColor || '#5C9F34',
          upColor: this.ui.upColor || '#F64843',
        }
      },

      xAxis: {
        // crosshair: true,
        gridLineColor: '#F5F5F5',
        endOnTick: false,
        gridLineWidth: 1,
        minRange: 3600 * 1000 * 24 * 50,
        labels: {
          enabled: false
        }
      },

      yAxis: {
        // crosshair: true,
        gridLineColor: '#F5F5F5',
        plotLines: [plotLines],
        endOnTick: false,
        labels: {
          style: {
            fontSize: '18px',
          }
        }, 
      },

      series: [{
        name: stockName,
        type: 'candlestick',
        data: data,
        id: 'dataseries',
        dataGrouping: {
          enabled: false
        },
        tooltip: {
          valueDecimals: 2
        }
      }],

      tooltip: {
        useHTML: true,
        formatter: function(e) {
          return [
            '<p>' + Util.formateDate(this.points[0].key) + '</p>',
            '<p>' + this.points[0].series.name + '</p>',
            '<p>开盘：' + this.points[0].point.open + '</p>',
            '<p>最高：' + this.points[0].point.high + '</p>',
            '<p>最低：' + this.points[0].point.low + '</p>',
            '<p>收盘：' + this.points[0].point.close + '</p>'
          ].join('')
        },

        backgroundColor: self.ui.tooltipBackground || 'rgba(22,14,27,0.85)',
        borderColor: self.ui.background || '#2f2543'
      }
    });

  },

  replacePlotLines: function(price, type, oldId) {

  },

  setData: function(data) {
    this.instance.get('dataseries').setData(data, true);
  },

  addPoint: function(point) {
    //console.log(point)
    // this.instance.get('dataseries').addPoint(point, false, true);
    // this.instance.redraw();

    // console.log(this.instance)
    var self = this;
    var data = this.instance.get('dataseries').data;
    var lastData = data[data.length - 1];
    var lastDate = new Date(lastData.category);
    var date = new Date(point[0]);


    switch (this.selectedIndex) {
      case 0:
        // console.log(date.getMinutes(), lastDate.getMinutes())
        if (date.getMinutes() === lastDate.getMinutes()) {
          update();
        } else {
          return add();
          console.log(point);
        }
        break;
      case 1:
        if (date.getHours() === lastDate.getHours()) {
          if (date.getMinutes() - lastDate.getMinutes() >= 5) {
            return add();
          } else {
            update();
          }
        } else {
          return add();
        }
        break;
      default:
        update();
    }

    function update() {
      lastData.update(point);
    }

    function add() {
      // [x, open, high, low, close]
      var newPoint = [point[0], point[4], point[4], point[4], point[4]];
      try {
        self.instance.get('dataseries').addPoint(point, false, true);
        self.instance.redraw();

        return newPoint;
      } catch (e) {
        console.log(e);

      }
    }
  },

  updatePlotLine: function(price, up) {
    //window.a = this.instance.yAxis[0].plotLinesAndBands[0]
    // this.instance.yAxis[0].removePlotLine('down');
    var plotLines;
    if (up) {
      plotLines = this.upPlotLine;
    } else {
      plotLines = this.downPlotLine;
    }

    plotLines.value = price;
    plotLines.label.text = price;


    this.instance.yAxis[0].removePlotLine(this.plotLinesId);
    this.instance.yAxis[0].addPlotLine(plotLines);

    this.plotLinesId = plotLines.id;
  },

  /**
   * kind: open 开仓价格 close 平仓价格
   *
   */
  addPlotLine: function(price, kind) {
    var plotLines;
    if (kind === 'open') {
      plotLines = this.openPlotLine;
      plotLines.label.text = "开仓: " + price;
    } else {
      plotLines = this.closePlotLine;
      plotLines.label.text = "平仓: " + price;
    }
    plotLines.value = price;

    this.instance.yAxis[0].addPlotLine(plotLines);
  },

  attrs: {
    data: null,
    downPrice: 0.0,
    downPriceTxt: '',
    upPrice: 0.0,
    upPriceTxt: '',


    openPlotLine: {
      id: 'openprice',
      value: 0,
      color: 'rgba(150,122,220,1)',
      dashStyle: 'shortdash',
      width: 1,
      label: {
        text: '',
        align: 'left',
        useHTML: true,
        style: {
          backgroundColor: getChartUi().openPlotLineBackground || 'rgba(150,122,220,1)',
          color: '#fff',
          border: '1px solid #967abc',
          '-webkitBorderRadius': '.05rem',
          borderRadius: '.05rem',
          fontSize: '.45rem',
          textAlign: 'center',
          paddingLeft: '.15rem',
          paddingRight: '.15rem',
          height: '.75rem',
          lineHeight: '.75rem',
          align: 'right'
        }
      }
    },

    closePlotLine: {
      id: 'closeprice',
      value: 0,
      color: 'rgba(109,164,202,1)',
      dashStyle: 'shortdash',
      width: 1,
      label: {
        text: '',
        align: 'left',
        useHTML: true,
        style: {
          backgroundColor: getChartUi().closePlotLineBackground || 'rgba(109,164,202,1)',
          color: '#fff',
          border: '1px solid #6da4ca',
          '-webkitBorderRadius': '.05rem',
          borderRadius: '.05rem',
          fontSize: '.45rem',
          textAlign: 'center',
          paddingLeft: '.15rem',
          paddingRight: '.15rem',
          height: '.75rem',
          lineHeight: '.75rem',
          align: 'right'
        }
      }
    },

    downPlotLine: {
      //value: downPrice,
      value: 0,
      id: 'down',
      color: '#1e6466',
      width: 2,
      label: {
        text: '', //downPriceTxt,
        align: 'center',
        useHTML: true,
        style: {
          backgroundColor: getChartUi().downPlotLinebackground || '#24bba8',
          color: '#fff',
          border: '1px solid #1d6b6b',
          '-webkitBorderRadius': '.05rem',
          borderRadius: '.05rem',
          fontSize: '.45rem',
          textAlign: 'center',
          paddingLeft: '.15rem',
          paddingRight: '.15rem',
          height: '.75rem',
          lineHeight: '.75rem',
          align: 'right'
        }
      }
    },

    upPlotLine: {
      value: 0,
      id: 'up',
      color: '#862b34',
      width: 2,
      label: {
        text: '',
        useHTML: true,
        align: 'center',
        style: {
          backgroundColor: getChartUi().upPlotLinebackground || '#f44846',
          color: '#fff',
          border: '1px solid #8d2c37',
          '-webkitBorderRadius': '.05rem',
          borderRadius: '.05rem',
          fontSize: '.45rem',
          textAlign: 'center',
          paddingLeft: '.15rem',
          paddingRight: '.15rem',
          height: '.75rem',
          lineHeight: '.75rem'

        }
      }
    }
  }
});

module.exports = Chart;