'use strict';
import PageBase from '../../../app/page-base';
import Symbol from '../../../app/symbol';
import Util from '../../../app/util';
import tmpl from './index.ejs';

export default class HotSymbols extends PageBase {
    constructor(config){
        super(config);

        this._init();
    }

    _init() {
        this._getData();
    }

    _lazyBind() {
        this.subscribe('stomp:price:update', (data) => {
            var oldSymbol = this.cacheSymbol[data.symbol];
            oldSymbol && this._updatePrice(data);
        });
    }

    _getData() {
        var self = this,
            token = Cookie.get('token');
  
        var data = { access_token: token }
  
        var type = this.isDemo() ? 'demo' : 'real';

        if (!this.cookie.get('tradingUI')) {
            this.cookie.set('tradingUI', getDefaultTradingUI());
        }

        var tradingUI = this.cookie.get('tradingUI');

        // 极速
        if (tradingUI == 6) {
            var symbols = getDefaultRapidSymbols();
            symbols.length = 3;
            Symbol.get(symbols).then((data) => {

                this._parse(data);

                if (tradingUI == 4) {
                    data.tradeUI = './pro-trading.html?';
                } else {
                    data.tradeUI = './rapid.html?deal=investnow&';
                }
                
                this.render(tmpl, data, this.el);
    
                this._lazyBind();
            });

            return;
        }

        this.ajax({
            url: '/v3/' + type + '/symbols6/',
            data: data
          }).then((data) => {
            data = data.data;
            data.length = 3;

            self._parse(data);

            // 用户自己切换的方案
            if (tradingUI == 4) {
              data.tradeUI = './pro-trading.html?';
            } else {
              data.tradeUI = './rapid.html?deal=investnow&';
            }
            
            this.render(tmpl, data, this.el);
      
            this._lazyBind();
        });
        
    }

    _updatePrice(data) {
        var oldSymbol = this.cacheSymbol[data.symbol];
        var minUnit = oldSymbol.minUnit.toString();
        var pip = oldSymbol.pip;
    
        try {
          var itemEl = $('.item[data-symbol=' + data.symbol + ']');
        } catch (e) {
          var itemEl = $('.item[data-symbolname=' + data.symbol.replace(/\./g, '--') + ']');
        }
    
        var percentEl = $('.percent', itemEl);
        minUnit = minUnit.split('.')[1].split('').length;
    
        var askPrice = data.askPrice;
        var bidPrice = data.bidPrice;
    
        // if (新价格.bid >= 老价格.bid || 新价格.ask >= 老价格.ask) 两个报价颜色设置为红色
        if (askPrice > oldSymbol.askPrice || bidPrice >= oldSymbol.bidPrice) {
          itemEl.addClass('up');
        } else {
          itemEl.removeClass('up');
        }
    
        // if (涨幅>0) {涨幅背景为红色}
        if ((+askPrice) + (+bidPrice) - 2 * oldSymbol.closePrice > 0) {
          percentEl.addClass('up');
        } else {
          percentEl.removeClass('up');
        }
    
        if (askPrice) {
          askPrice = parseFloat(askPrice).toFixed(minUnit);
          $('.J_AskPrice', itemEl).text(askPrice);
          oldSymbol.askPrice = askPrice;
        }
    
        // if (bidPrice) {
        //   bidPrice = parseFloat(bidPrice).toFixed(minUnit);
        //   $('.J_BidPrice', itemEl).text(bidPrice);
        //   oldSymbol.bidPrice = bidPrice;
        // }
    }

    _parse(data) {
        var type = this.isDemo() ? 'demo' : 'real';
        var self = this,
          symbols = [],
          cacheSymbol = {};
        this.symbols = [];
    
        $.each(data, (index, item) => {
          if (item.quote) {
            var closeTime = item.close_time[0];
            var time = Date.now();
    
            if (closeTime && time < Util.getTime(closeTime.end) && time > Util.getTime(closeTime.start)) {
              // item.tag = '休市';
              item.tag = closeTime.reason;
              item.className = 'close';
            } else if (item.policy.real_enabled == '0' && item.policy.demo_enabled == '0') {
              item.tag = '不可交易';
              // item.className = ''
            } else if (type === 'real' && item.policy.real_enabled == '0') {
              item.tag = '限模拟';
              item.className = 'simulate';
            } else {
              symbols.push(item);
            }
    
            cacheSymbol[item.policy.symbol] = {
              pip: item.policy.pip,
              minUnit: item.policy.min_quote_unit,
              askPrice: item.quote.ask_price[0],
              bidPrice: item.quote.bid_price[0],
              closePrice: item.close_price
            };
    
            this.symbols.push(item.policy.symbol);
          }
        });
    
        this.cacheSymbol = cacheSymbol;
    
        // 计算余额不足
        if (symbols.length < 0) {
          return;
        }
    }
}