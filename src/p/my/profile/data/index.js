var PageBase = require('../../../../app/page-base');
var Uri = require('../../../../app/uri');
var AreaChart = require('../../data/area-chart');
var TopBanner = require('../../data/area-spline');
var detailTmpl = require('../../data/index.ejs');
export default class Data extends PageBase {
	constructor(config) {
		super(config);
		this._requires();
	    this.getAnalysis();
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

	      // $('#J_OtherRate').text((data.average_month_rate_of_return * 100).toFixed(2));

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
