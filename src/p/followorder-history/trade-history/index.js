/**
 * 当前交易
 */

"use strict";
require('./index.css');
var Base = require('../../../app/base');
var Cookie = require('../../../lib/cookie');
var tmpl = require('./index.ejs.html');

export default class TradeHistroy extends Base{
	constructor(config) {
		super(config);
		this._initAttrs();
		this._init();
	}

	_init() {
		this._getData();
	}

	_bind() {

	}

	_getData() {
		var data = {
			access_token: Cookie.get('token'),
			expert_id: this.id
		}
		this.ajax({
			url: '/v1/follow/follower/expert/'+ this.id +'/ticket/history/',
			data: data
		}).then((data) => {
			data = data.data;
			data = data.reverse(); // 倒排一下
			this.render(tmpl, data, this.el);
		})
	}

	destroy() {

	}

	_initAttrs() {
	}
}
