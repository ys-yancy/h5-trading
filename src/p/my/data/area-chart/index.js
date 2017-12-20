// 'use strict';

var PageBase = require('../../../../app/page-base');
var Util = require('../../../../app/util');
var tmpl = require('./index.ejs');

export default class Info extends PageBase {
  constructor(config) {
    super(config);

    this._bind();
  }

  _bind() {
    this.subscribe('get:stat', this._getStat, this);
  }

  _getStat(data) {
    var obj = {};
    data = data.data;
    var names = {};

    $.each(data, (key, val) => {
      if (obj[key]) {
        obj[key] += val.profit_proportion;
      } else {
        obj[key] = val.profit_proportion;
        names[key] = val.name;
      }
    });

    var keys = Object.keys(obj).sort(function(a, b) {
      return obj[b] - obj[a];
    });

    var total = 0;
    var other = 0;
    var data = [];

    keys.forEach((key, index) => {
      if (obj[key] > 0) {
        total += parseFloat(obj[key]);

        if (index <= 2) {
          data.push(obj[key]);
        } else {
          other += parseFloat(obj[key]);
        }
      }
    });

    if (total === 0) {
      data = [1];
    } else {
      other && data.push(other);

      data.forEach(function(val, index) {
        data[index] = val / total;
      });
    }

    var cateNames = [];

    var cateNames = [];

    keys.forEach((key) => {
      cateNames.push(names[key]);
    });
    
    this._initChart(data);

    this.render(tmpl, { list: data, symbols: cateNames, other: !!other }, $('#J_List'));

  }

  _initChart(data) {
    var colors = ['#f9584a', '#ffc000', '#67b2e1', '#25b9a8'];

    colors[data.length - 1] = '#25b9a8';

    this.chart = new Highcharts.Chart({
      chart: {
        renderTo: 'J_ChartArea',
        type: 'pie',
        margin: [0, 0, 0, 0],
        spacingTop: 0,
        spacingBottom: 0,
        spacingLeft: 0,
        spacingRight: 0,
        backgroundColor: 'transparent'
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
        text: '利润占比',
        align: 'center',
        verticalAlign: 'middle',
        useHTML: true,
        style: {
          color: '#90879f',
          fontSize: '.65rem'
        }
      },
      colors: colors,
      tooltip: {
        useHTML: true,
        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
      },
      plotOptions: {
        pie: {
          size: '100%',
          dataLabels: {
            enabled: true,
            distance: -50,
            style: {
              fontWeight: 'bold',
              color: 'white',
              textShadow: '0px 1px 2px black'
            }
          },
          startAngle: 45,
          endAngle: 405
        }
      },
      series: [{
        type: 'pie',
        name: '利润占比',
        innerSize: '65%',
        data: data
      }]
    });

  }
}