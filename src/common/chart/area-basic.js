/**
 * 账户余额
 */

var Base = require('../../app/base');
function CreateAreaBasisc() {
  CreateAreaBasisc.superclass.constructor.apply(this, arguments);
  this._init();
}

Base.extend(CreateAreaBasisc, Base, {
  _init: function() {
    this._initAreaChart();
  },

  getInstance: function() {
      return this.instance;
    },

  _initAreaChart() {
    var chartWrapEl = this.el,
      chartName = this.chartName,
      data = this.data;

    this.instance = new Highcharts.Chart({
        chart: {
          renderTo: chartWrapEl,
          type: 'area',
          className: 'high-chart-area',
          reflow: true,
          pinchType: 'x',
          zoomType: '',
          panning: true
        },

        title: {
          useHTML: true,
          text: '账户余额',
          align: 'left',
          x: 10,
          y: -8,
            style: {
                fontSize: '0.6rem',
                color: '#7C7C7C'
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

          legend: {
            enabled: false
          },

        scrollbar: {
            enabled: false,
            liveRedraw: false
        },

        plotOptions: {
          series: {
            lineColor: getChartUi().otherChartColor,
            marker: {
              lineWidth: 2,
              radius: 3,
              symbol: 'circle',
                  fillColor: 'white',
                  lineColor: getChartUi().otherChartColor
              }
          }
        },

        xAxis: {
          type: 'datetime',
          gridLineWidth: 1,
          gridLineColor: '#F6F6F6',
          gridLineDashStyle: 'Solid'
        },

        yAxis: {
          gridLineColor: '#F6F6F6',
          gridLineDashStyle: 'Solid',
          title: {
            style: {
              display: 'none'
            }
          }
        },

        tooltip: {
          useHTML: true,
            formatter: function(e) {
              return '<p>&nbsp;' + this.y + '&nbsp;</p>'
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

        series: [{
          name: chartName,
          data: data,
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
        }]
    })
  }
})

module.exports = CreateAreaBasisc;