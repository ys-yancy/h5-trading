/**
 * 当前交易
 */

"use strict";
require('./index.css');
var PageBase = require('../../../app/page-base');
var Config = require('../../../app/config');
var Symbol = require('../../../app/symbol');
var Symbols = require('../../../app/symbols');
var Cookie = require('../../../lib/cookie');
var tmpl = require('./index.ejs.html');

export default class TradeCurrent extends PageBase{
	constructor(config) {

		super(config);

		this.orderList = [];
		this._initAttrs();
		this._init();
	}

	_init() {
		this._bind();
		this._getData();

		this.getAccount().then((data) => {
			var type = Cookie.get('type');
			this.account = data.account;
			this._updateFollowOrderProfit(this.account);
		})
	}

	_bind() {
		this.on('destroy', this.destroy);
	}

	_getData() {
		var data = {
			access_token: Cookie.get('token'),
			expert_id: this.id
		}
		this.ajax({
			url: '/v1/follow/follower/expert/'+ this.id +'/ticket/current/',
			data: data
		}).then((data) => {
			data = data.data;
			// 我的跟单与榜单下行的数据有所不同
			if( !$.isArray(data) ) {
				data = []
			}

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

	_updateFollowOrderPrice(price) {
		this._update(price);	
	}

	_updateFollowOrderProfit(account) {
		account = account || this.account;
		this._getFloatingProfitListAdapter(account).then((profrit) => {
			if (!profrit) {
				return;
			}

			var listEls = $('.J_FollowerOrder', this.el);
			for ( var i = 0, len = listEls.length; i < len; i++ ) {
				var curListEl = $(listEls[i]);
				var ticket = curListEl.attr('data-ticket');
				var profit = parseFloat(profrit[ticket]).toFixed(2);
				if (profit > 0) {
					$('.J_TradeCurrentProfit', curListEl).addClass('up');
				} else {
					$('.J_TradeCurrentProfit', curListEl).removeClass('up');
				}

				$('.J_TradeCurrentProfit', curListEl).text(profit);
			}
		})

		this.updateProfitController = setTimeout(() => {
			this._updateFollowOrderProfit();
		}, 1000);
	}

	_getFloatingProfitListAdapter(account) {
		var symbols = [],
			orderList = this.orderList;
		orderList.forEach((item) => {
			if (symbols.indexOf(item.symbol) === -1) {
		        symbols.push(item.symbol);
		    }
		});

		return this.getRealFloatingProfit(account, orderList, symbols).then((obj, floatList, prices) => {
			if ( orderList.length === 0 ) {
				return false;
			}
			prices = prices || [];
			if (prices && $.isArray(prices) && prices.length > 0) {
				for (var j = 0, len = prices.length; j < len; j++) {
					this._update(prices[j]);
				}
			}
			return floatList;
		})

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
		}catch(e){
		}
	}

	getRealFloatingProfit(account, orderList, symbols) {
	    var deferred = new $.Deferred(),
	      self = this,
	      orderLen = orderList.length,
	      mainProfit = 0,
	      floatList = {},
	      count = 0,
	      type = 'real';

	    if (orderLen === 0) {
	      deferred.resolve(0);
	    }

	    var groupName = account;

	    this.getCurrentPrice(symbols, true).then(function(prices) {
	      Symbol.get(symbols).then(function(optionList) {
	        try {
	          var deferreds = getProfitList(optionList, prices, orderList);
	        } catch (e) {}

	        $.when.apply($, deferreds).done(function() {
	          deferred.resolve(mainProfit, floatList || [], prices || []);
	        });
	      });
	    });

	    return deferred.promise();

	    function getProfitList(optionList, prices, orderList) {
	      var deferreds = [];

	      $.each(orderList, function(index, item) {
	        deferreds.push(getProfit(item, prices, optionList));
	      });

	      return deferreds;
	    }

	    function getProfit(item, prices, optionList) {
	      var d = new $.Deferred(),
	        symbol = item.symbol,
	        current_price = getPrice(prices, symbol),
	        policy = getSym(optionList, symbol).policy;

	      if (!current_price) {
	        d.resolve(0);
	        return d.promise();
	      }

	      // 开仓价格与当前价格的价差, cmd还有挂单的可能性, 但是挂单没有浮动盈亏
	      var price_delta = 0;
	      if (item.status == 'open' && item.cmd.indexOf('buy') != -1) {
	        price_delta = current_price.bid_price[0] - item.openPrice;

	      } else if (item.status == 'open' && item.cmd.indexOf('sell') != -1) {
	        price_delta = item.openPrice - current_price.ask_price[0];
	       
	      }

	      // 品种trading_currency于账户home_currency的报价
	      var trading_currency = policy.trading_currency;
	      var trading_home_price = 0;

	      if (trading_currency == account[type].currency) {
	        trading_home_price = 1;
	        d.resolve(profit(trading_home_price, item));
	      } else {

	        var trading_home_symbol = trading_currency + account[type].currency;

	        var alg = 0;
	        // 提前判断，如果当前品种不在列表里，则转换，减少请求
	        if (!Symbols.has(trading_home_symbol)) {
	          trading_home_symbol = account[type].currency + trading_currency;
	          alg = 1;
	        }

	        self.getCurrentPrice(trading_home_symbol, true).then(function(temp_price) {
	          if (alg == 0) {
	            if (temp_price && temp_price.bid_price) {
	              trading_home_price = parseFloat(temp_price.bid_price[0]);
	              d.resolve(profit(trading_home_price, item));
	            }
	          } else {

	            if (temp_price && temp_price.ask_price) {

	              trading_home_price = parseFloat(temp_price.ask_price[0]);

	              trading_home_price = 1 / trading_home_price;
	              d.resolve(profit(trading_home_price, item));
	            } else {
	              d.resolve(profit(0, item));
	            }
	          }

	        });

	      }

	      function profit(trading_home_price, item) {
	        // 只有status=open的订单才需要计算profit
	        var profitNum = parseFloat(item.profit);
	        if (item.status == 'open') {
	          profitNum = parseFloat(price_delta) * parseFloat(policy.lot_size) * parseFloat(item.volume) * parseFloat(trading_home_price);
	          profitNum = profitNum + parseFloat(item.swap || 0) - parseFloat(item.commission || 0);
	        }

	        floatList[item.ticket] = profitNum;
	        mainProfit += profitNum;
	        return profitNum;
	      }


	      return d.promise();
	    }

	    function getPrice(prices, symbol) {
	      for (var i = 0, len = prices.length; i < len; i++) {
	        if (prices[i].symbol === symbol) {
	          return prices[i];
	        }
	      }
	    }

	    function getSym(optionList, symbol) {
	      for (var i = 0, len = optionList.length; i < len; i++) {
	        if (optionList[i].policy.symbol === symbol) {
	          return optionList[i];
	        }
	      }
	    }
	}

	_interval() {
		clearTimeout(this.getController);
		this.getController = setTimeout(() => {
			this._getData();
			this._interval();
		}, 1000 * 30)
	}

	destroy() {
		this.orderList = null;
		this.__acconut = null;
		clearTimeout(this.getController);
		clearTimeout(this.updateProfitController);
		this.unsubscribe('stomp:price:update', this._updateFollowOrderPrice, this);
	}

	_initAttrs() {
	}
}
