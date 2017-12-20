// 'use strict';

var PageBase = require('../../../../app/page-base');
var Util = require('../../../../app/util');
var Uri = require('../../../../app/uri');
// var Highcharts = require('../../../../lib/highstock');
// var Config = require('../../../../app/config');
// var tmpl = require('./index.ejs');

export default class TopBanner extends PageBase {
  constructor(config) {
    super(config);

    this._getData();
    // this._initChart();
    this._bind();
  }

  _bind() {
    this.subscribe('get:analysis', this._getAnalysis, this);
  }

  _getData() {

    // 访问自己的页面, 不需要显示"Ta的收益率"
    /*
    if (this.cookie.get('inviteCode') == new Uri().getParam('inviteCode'))
    {
      $('.other').remove();
      return;
    }
    */

    // 本地没有token, 证明是新用户, 不需要显示"我的收益率"
    if (!this.cookie.get('token')) {
      this.my.length = 1;
      return;
    }

    var self = this; 

    this.ajax({
      url: '/v1/user/ror/month/history',
      data: {
        access_token: this.cookie.get('token')
      }
    }).then((data) => {
      // console.log(data);

      data = data.data;

      $('#J_MyRate').text((data.average_month_rate_of_return * 100).toFixed(2)).parent().show();



      data.month_rate_of_return.forEach((item) => {
        item.month = Util.getTime(item.month, 'YYYYMM');
        item.ror = item.ror * 100;
        self.my.push([item.month, item.ror]);
      });
      /*
      data.month_rate_of_return = data.month_rate_of_return.sort(function(v1, v2) {
        return v1.month - v2.month;
      });
      */

      this._check();
    });
  }

  _getAnalysis(e) {
    if (this.personal) {
      this.other.length = 1;
    } else {
      e.data.forEach((item) => {
        item.month = Util.getTime(item.month, 'YYYYMM');
        item.ror = item.ror * 100;
        this.other.push([item.month, item.ror]);
      });
      /*
      e.data = e.data.sort(function(v1, v2) {
        return v1.month - v2.month;
      });
      */
    }

    this._check();

    // this.chart.series[0].setData(e.data);
  }

  _check() {
    if (this.my.length > 0 && this.other.length > 0) {
      this._initChart();
    }
  }

  _initChart() {
    // console.log(JSON.stringify(this.my), this.my.length, JSON.stringify(this.other), this.other.length);
    
    this.my.sort(function(v1, v2) {
      return v1[0] - v2[0];
    });

    this.other.sort(function(v1, v2) {
      return v1[0] - v2[0];
    });


    this.chart = new Highcharts.Chart({
      chart: {
        renderTo: 'J_ChartSpline',
        type: 'areaspline',
        margin: [40, 40, 40, 40],
        spacingTop: 0,
        spacingBottom: 0,
        spacingLeft: 0,
        spacingRight: 0,
        backgroundColor: 'transparent',
        // height: $('#J_ChartSpline').height()
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
      title: {
        style: {
          display: 'none'
        }
      },
      colors: ['#967adc', '#ffd201'],

      xAxis: {
        // gridLineColor: '#20182d',
        // gridLineWidth: 1,
        lineColor: '#352d43',

        type: 'datetime',
        // max: Date.now() + 3600 * 1000
        // minRange: 3600 * 1000 * 24 * 50
      },
      // tooltip: {
      //   shared: true,
      //   valueSuffix: ' units'
      // },
      tooltip: {
        useHTML: true,
        //xDateFormat: '%Y-%m-%d %H:%M:%S',
        formatter: function(e) {
          var date = Util.formateDate(this.x, 'YYYY-MM');
          var day = new Date(this.x).getDay();

          // var days = ['一', '二', '三', '四', '五', '六', '日']
          // return '<p>' + this.points[0].point.y + '</p>'
          return '<p> ' + date + '</p><p>收益率 ' + (this.y).toFixed(2) + '%</p>'
        },

        backgroundColor: 'rgba(0,0,0,.5)',
        style: {
          color: '#fff',
          fontSize: '.55rem',
          lineHeight: '.8rem'
        },
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#34294c'
      },
      plotOptions: {
        size: '100%',
        areaspline: {
          fillOpacity: 0.5
        },
        series: {

        }
      },
      yAxis: {
        gridLineColor: 'rgba(0,0,0,0)'
      },
      legend: {
        enabled: false,
        style: {
          display: 'none'
        }
      },
      series: [{
        name: 'John',
        data: this.my,
        fillColor: {
          linearGradient: [0, 0, 0, 300],
          stops: [
            [0, '#24173f'],
            [1, '#160e23']
          ]
        }
      }, {
        name: 'Jane',
        data: this.other,
        fillColor: {
          linearGradient: [0, 0, 0, 300],
          stops: [
            [0, 'rgba(0,0,0,0)'],
            [1, 'rgba(0,0,0,0)']
          ]
        }
      }]
    });
  }

  defaults() {
    return {
      my: [],
      other: []
    }
  }
}