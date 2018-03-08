/**
 * 当前交易
 */

"use strict";
require('./index.css');
var PageBase = require('../../../app/page-base');
var Config = require('../../../app/config');
var Cookie = require('../../../lib/cookie');
var Util = require('../../../app/util');
var tmpl = require('./index.ejs');
var tmpl2 = require('./index-2.ejs');

export default class TradeCurrent extends PageBase{
	constructor(config) {

		super(config);

		this.orderList = [];
		this._init();
	}

	_init() {
		// this._bind();
		this._getData();
	}

	_bind() {
		// this.subscribe('stomp:price:update', this._updateFollowOrderPrice, this);
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
			// var symbols = [];
			var now_date = Date.now();

			for ( var i = 0; i < data.length; i++ ) {
				var item = data[i];
				// var symbol = item.symbol;

				var desc = '刚刚';
				var item_time = Util.getTime(item.openTime);
				var minTime = now_date - item_time;
				var seconds = Math.floor(minTime / 1000);  // 秒
				var minutes = Math.floor(minTime / (1000 * 60));  // 分钟
				var hours = Math.floor(minTime / (1000 * 3600));  // 小时
				var days = Math.floor(minTime / (1000 * 3600 * 24));  // 天
	
				if (hours > 24) {
					desc = days + '日前';
				} else if (minutes > 60) {
					desc = hours + '小时前';
				} else if (seconds > 60) {
					desc = minutes + '分钟前';
				}
	
				item.isShowDesc = desc;
	
				item.avatar = item.avatar ? Config.getAvatarPrefix(item.avatar) : getDefaultIconWL();
				
				// if (symbols.indexOf(symbol) === -1) {
				// 	symbols.push(symbol)
				// }
			}

			this.orderList = data;
			this.render(tmpl2, data, this.el);

			// this._getAllPrices(symbols);
		})

		// this._interval();
	}

	// _updateFollowOrderPrice(price) {
	// 	this._update(price);	
	// }

	// _updateFollowOrderProfit() {
	// 	var account = this._getAccount();
	// 	this._getFloatingProfitListAdapter(account).then((profrit) => {
	// 		if (!profrit) {
	// 			return;
	// 		}

	// 		var listEls = $('.J_FollowerOrder', this.el);
	// 		for ( var i = 0, len = listEls.length; i < len; i++ ) {
	// 			var curListEl = $(listEls[i]);
	// 			var ticket = curListEl.attr('data-ticket');
	// 			var profit = parseFloat(profrit[ticket]).toFixed(2);

	// 			if (profit > 0) {
	// 				$('.J_TradeCurrentProfit', curListEl).addClass('up');
	// 			} else {
	// 				$('.J_TradeCurrentProfit', curListEl).removeClass('up');
	// 			}

	// 			$('.J_TradeCurrentProfit', curListEl).text(profit);
	// 		}
	// 	})

	// 	this.updateProfitController = setTimeout(() => {
	// 		this._updateFollowOrderProfit();
	// 	}, 1000);
	// }

	// _getFloatingProfitListAdapter(account) {
	// 	var accountAdapter = {
	// 		real: {
	// 			currency: 'USD'
	// 		},
	// 		demo: {
	// 			currency: 'USD'
	// 		}
	// 	}

	// 	account = account || accountAdapter;

	// 	var symbols = [],
	// 		orderList = this.orderList;
	// 	orderList.forEach((item) => {
	// 		if (symbols.indexOf(item.symbol) === -1) {
	// 	        symbols.push(item.symbol);
	// 	    }
	// 	});
	// 	return this.getFloatingProfitList(account, orderList, symbols).then((obj) => {
	// 		if ( orderList.length === 0 ) {
	// 			return false;
	// 		}
	// 		var prices = obj.prices;
	// 		if (prices && $.isArray(prices) && prices.length > 0) {
	// 			for (var j = 0, len = prices.length; j < len; j++) {
	// 				this._update(prices[j]);
	// 			}
	// 		}

	// 		return obj.floatList;
	// 	})

	// }

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
		}catch(e){
			
		}
	}

	_interval() {
		clearTimeout(this.getController);
		this.getController = setTimeout(() => {
			this._getData();
			this._interval();
		}, 1000 * 15)
	}

}
