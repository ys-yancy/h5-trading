/**
 * 收益表现
 */

var Base = require('../../app/base');
function CreateColumnBasisc() {
  CreateColumnBasisc.superclass.constructor.apply(this, arguments);
  this._init();
}

Base.extend(CreateColumnBasisc, Base, {
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
          type: 'column',
          className: 'high-chart-column',
          reflow: true,
          pinchType: 'x',
          zoomType: '',
          panning: true
        },

        title: {
          useHTML: true,
          text: '收益表现',
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
            color: getChartUi().otherChartColor,
            negativeColor: getChartUi().areaColor,
          }
        },

        xAxis: {
          type: 'datetime',
          gridLineWidth: 1,
          gridLineColor: '#F6F6F6',
          gridLineDashStyle: 'Solid'
          // labels: {
        //           format: '{value:%Y - %d}',
        //           align: 'right',
        //       }
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
          data: data
        }]
    })
  }
})

module.exports = CreateColumnBasisc;