/**
 * mini面积图
 */

var Base = require('../.../../../../app/base');
function CreateMiniLineBasisc() {
  CreateMiniLineBasisc.superclass.constructor.apply(this, arguments);
  this._init();
}

Base.extend(CreateMiniLineBasisc, Base, {
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
          type: 'line',
          className: 'high-chart-miniLine',
          width: 180,
          height: 70,
          borderWidth: 0,
          backgroundColor: null,
          style: {
            overflow: 'hidden'
          },
          skipClone: true
        },

        title: {    
          text: ''
        },

        colors: ['#4FBEEB'],

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
                animation: false,
                lineWidth: 1,
                shadow: false,
                states: {
                    hover: {
                        lineWidth: 1
                    }
                },
                marker: {
                    radius: 0,
                    states: {
                        hover: {
                            radius: 2
                        }
                    }
                }
            }
        },

        xAxis: {
            labels: {
                enabled: false
            },
            title: {
                text: null
            },
            lineColor: 'transparent',
            gridLineWidth: 0,
            startOnTick: false,
            endOnTick: false,
            tickPositions: []
        },
        yAxis: {
          gridLineWidth: 0,
            endOnTick: false,
            startOnTick: false,
            labels: {
                enabled: false
            },
            title: {
                text: null
            },
            tickPositions: [0]
        },

        tooltip: {
            useHTML: true,
            formatter: function(e) {
              return '<p>&nbsp;' + this.point.options['y'] + '&nbsp;</p>'
            },
            backgroundColor: '#3AB9E6',
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

module.exports = CreateMiniLineBasisc;