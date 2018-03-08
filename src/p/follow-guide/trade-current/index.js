/**
 * 当前交易
 */

"use strict";
require('./index.css');
var PageBase = require('../../../app/page-base');
var Config = require('../../../app/config');
var Cookie = require('../../../lib/cookie');
var tmpl = require('./index.ejs');

export default class TradeCurrent extends PageBase{
	constructor(config) {

		super(config);

		this.orderList = [];
		this._init();
	}

	_init() {
		this._getData();
	}

	_getData() {
		var data = {
			access_token: Cookie.get('token'),
			expert_id: this.id
		}
		this.ajax({
			url: '/v1/follow/rank/expert/'+ this.id +'/ticket/current/',
			data: data
		}).then((data) => {
			data = data.data;

			data = data.reverse(); // 倒排一下
			var symbols = [];
			for ( var i = 0; i < data.length; i++ ) {
				var symbol = data[i].symbol;
				if (symbols.indexOf(symbol) === -1) {
					symbols.push(symbol)
				}
			}

			this.orderList = data;
			this.render(tmpl, data, this.el);

			this._getAllPrices(symbols);
		})

		// this._interval();
	}

	_getAllPrices(symbols) {
		this.getCurrentPrice(symbols, true).then((symbols) => {
			symbols.forEach((item) => {
				this._update(item);
			})
		})
	}

	_update(priceObj) {
		try{
			var symbol = priceObj.symbol.replace(/\./g, '-');
			var priceEls = $('.J_TardeCurrentPrice[data-symbol='+ symbol +']', this.el);
			
			$.each(priceEls, function (index, item) {
				var item = $(item),
					cur_price = priceObj.ask_price[0];

				if (item.attr('data-cmd').indexOf('buy') !== -1) {
					cur_price = priceObj.bid_price[0];
				} else {
					cur_price = priceObj.ask_price[0];
				}
				item.text(cur_price)
			})
		}catch(e){}
	}

	// _interval() {
	// 	clearTimeout(this.getController);
	// 	this.getController = setTimeout(() => {
	// 		this._getData();
	// 		this._interval();
	// 	}, 1000 * 15)
	// }

}
