'use strict';

require('../common/header');

var PageBase = require('../../../app/page-base');
var Uri = require('../../../app/uri');
var AreaChart = require('./area-chart');
var TopBanner = require('./area-spline');
var detailTmpl = require('./index.ejs');

require('../common/header');
var Header = require('../../../common/header');

class Data extends PageBase {
  constructor() {
    super();

    this.inviteCode = new Uri().getParam('inviteCode');
    if (this.inviteCode === this.cookie.get('inviteCode')) {
      this.personal = true;

      $('.other').hide();
    }

    new Header();

    this._requires();
    this.configStatistics();

    this.getAnalysis();
    
    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }

  }

  getAnalysis() {
    this.ajax({
      url: '/v1/user/data/analysis',
      data: {
        invite_code: this.inviteCode,
        access_token: this.cookie.get('token') || ''
      }
    }).then((data) => {
      data = data.data;

      this.render(detailTmpl, data, $('#J_Detail'));

      $('#J_OtherRate').text((data.average_month_rate_of_return * 100).toFixed(2));

      this.broadcast('get:analysis', { data: data.month_rate_of_return });

      this.broadcast('get:stat', { data: data.category_stat });
    });
  }

  _requires() {
    new AreaChart({
      el: $('#J_AreaChart'),
      inviteCode: this.inviteCode,
      personal: this.personal
    });

    new TopBanner({
      el: '#J_ChartSpline',
      inviteCode: this.inviteCode
    })
  }
}

new Data();