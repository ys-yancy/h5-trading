/**
 * 交易统计
 */
"use strict";

require('./index.css');
var Base = require('../../../app/base');
var Util = require('../../../app/util');
var Cookie = require('../../../lib/cookie');
var CreateAreaBasisc = require('../../../common/chart/area-basic');
var CreateLineBasisc = require('../../../common/chart/line-basic');
var CreateColumnBasisc = require('../../../common/chart/column-basic');
var ChartDesc = require('./chartDesc');

var tmpl = require('./index.ejs.html');
export default class TradeCount extends Base {
	constructor(config) {
		super(config)

		this._render().then(() => {
			this._init();
		})
	}

	_init() {
		this._bind();
		this._initAttrs();
		this._initAreaChart();
		this._initLineChart();
		this._initColumnChart();
	}

	_bind() {
		this.el.on('tap', '.J_AmountDesc', $.proxy(this._showAmountDesc, this));

		this.el.on('tap', '.J_ProfitDesc', $.proxy(this._showProfitDesc, this));

		this.el.on('tap', '.J_RetreatDesc', $.proxy(this._showRetreatDesc, this));
	}

	_showAmountDesc(e) {
		var curEl = $(e.target);
		new ChartDesc({
			referEl: curEl,
			content: '交易信号的账户余额变化情况, 单位 美元.'
		})
	}

	_showProfitDesc(e) {
		var curEl = $(e.target);
		new ChartDesc({
			referEl: curEl,
			content: '按自然月统计, 以 点 为单位的收益表现情况.'
		})
	}

	_showRetreatDesc(e) {
		var curEl = $(e.target);
		new ChartDesc({
			referEl: curEl,
			content: '账户净值最大回撤数据, 以净值百分比来表示.'
		})
	}

	_initAreaChart() {
		this._request('balance').then((list) => {
			list = list.map((item) => {
				var arr = [],
					time = item.date + ' ' + '00:00:00',
					amount = parseFloat(item.amount).toFixed(2);
				arr.push(Util.getTime(time));
				arr.push(parseFloat(amount));
				return arr;
			})

			var renderEl = $('#J_TradeCountArea', this.el);
			var chartName = 'highchart-area';

			this.areaBasic = new CreateAreaBasisc({
				el: renderEl[0],
				chartName: chartName,
				data: list
			});
		})
	}

	_initColumnChart() {
		this._request('profit').then((list) => {
			list = list.map((item) => {
				var arr = [],
					time = item.date + ' ' + '00:00:00',
					amount = parseFloat(item.amount).toFixed(2);
				arr.push(Util.getTime(time));
				arr.push(parseFloat(amount));
				return arr;
			})

			var renderEl = $('#J_TradeCountColumn', this.el);
			var chartName = 'highchart-column';

			this.columnBasisc = new CreateColumnBasisc({
				el: renderEl[0],
				chartName: chartName,
				data: list
			})

		})
	}

	_initLineChart() {
		this._request('maxdrawdown').then((list) => {
			list = list.map((item) => {
				var arr = [],
					time = item.date + ' ' + '00:00:00',
					amount = parseFloat(item.amount).toFixed(2);
				arr.push(Util.getTime(time));
				arr.push(parseFloat(amount));
				return arr;
			})

			var renderEl = $('#J_TradeCountLine', this.el);
			var series_chart_name = 'highchart-line';

			this.lineBasisc = new CreateLineBasisc({
				el: renderEl[0],
				chartNames: series_chart_name,
				data: list
			})
		})
	}

	_request(source) {
		var data = {
			access_token: Cookie.get('token'),
			expert_id: this.id
		}
		return this.ajax({
			url: '/v1/follow/rank/expert/'+ this.id +'/'+ source +'/history/',
  			data: data
		}).then((data) => {
			return data.data;
		})
	}

	_render() {
		var data = {
			access_token: Cookie.get('token'),
			expert_id: this.id
		}
		return this.ajax({
			url: '/v1/follow/rank/expert/'+ this.id +'/trade/summary/',
  			data: data
		}).then((data) => {
			data = data.data;
			this.render(tmpl, data, this.el);
		})
	}

	destroy() {

	}
	
	_initAttrs() {
	}
}
