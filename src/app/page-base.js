"use strict";

var Base = require('./base');
var Cookie = require('../lib/cookie');
var Login = require('../common/login');
var Util = require('../app/util');
var Symbol = require('./symbol');
var Config = require('./config');
var stomp = require('./stomp');
var Symbols = require('./symbols');
var storage = require('./storage');
// var inviteCode= new require('./uri')().getParam('inviteCode');

var login = new Login();
window.Cookie = Cookie;
var listenLogin = false;
var groupName;
var cachePrice = {};
var cacheTime = {};
// var queuePrice = [];
const priceQueue = require('./queue');

var globalCachedAccount = null;
var globalGetAccountReqSent = false;
var globalGetAccountDefers = [];

var tagCache = {
  demo: false,
  real: false
};

if (Cookie.get('tradingUI') == 5) {
  Cookie.set('tradingUI', 6);
}
if (Cookie.get('tradingUI') == '') {
  Cookie.set('tradingUI', getDefaultTradingUI());
}



// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符， 
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) 
// 例子： 
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423 
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18 
Date.prototype.Format = function(fmt) { //author: meizz 
  var o = {
    "M+": this.getMonth() + 1, //月份 
    "d+": this.getDate(), //日 
    "h+": this.getHours(), //小时 
    "m+": this.getMinutes(), //分 
    "s+": this.getSeconds(), //秒 
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
    "S": this.getMilliseconds() //毫秒 
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}

function PageBase() {
  PageBase.superclass.constructor.apply(this, arguments);
  
  this.clearLocalStorageSymbols();

  this._preBind();

  // console.log ('document.cookie = ' + window.document.cookie);
  // console.log ('object = ' + this.toString());
}

Base.extend(PageBase, Base, {

  persistenSymbols(symbols) {
    symbols = typeof symbols === 'string' ? [symbols] : symbols;

    try {
      var token = Cookie.get('token');
      var type = this.isDemo() ? 'demo' : 'real';
      var hasNew = false;

      var key = `${token}:${type}:symbols`;


      var mySymbols = storage.get(key);
      mySymbols = mySymbols && JSON.parse(mySymbols);

      if (!$.isArray(mySymbols)) {
        mySymbols = [];
      }

      (symbols || []).forEach((symbol) => {
        if (mySymbols.indexOf(symbol) === -1) {
          mySymbols.push(symbol);
          hasNew = true;
        }
      });

      hasNew && storage.set(key, mySymbols);

    } catch (e) { console.log(e); }
  },

  getAllSymbolsPrice: function() {
    var key = this.isDemo() ? 'demoOptionList' : 'optionList';
    var token = Cookie.get('token');
    key = token + key;
    var type = this.isDemo() ? 'demo' : 'real';


    var defaultSymbols = [].concat(Config.getDefaultRapidSymbols());


    // 极速交易只使用配置的5个品种
    // if (Cookie.get('tradingUI') != 6) {
    var symbols = storage.get(key) || [];

    var mySymbols = storage.get(`${token}:${type}:symbols`);

    try {
      symbols = symbols && JSON.parse(symbols);
      mySymbols = mySymbols && JSON.parse(mySymbols);

      parse(symbols);
      parse(mySymbols);

      function parse(symbols) {
        if ($.isArray(symbols)) {
          for (var i = 0, len = symbols.length; i < len; i++) {
            if (defaultSymbols.indexOf(symbols[i]) === -1) {
              defaultSymbols.push(symbols[i])
            }
          }
        }
      }

    } catch (e) {}
    // } else {
    //   defaultSymbols = Config.getDefaultRapidSymbols();
    // }
    return this.getCurrentPrice(defaultSymbols);
  },

  getIntervalTime: function() {
    return Config.getInterval();
  },

  getCandleExpireTime: function() {
    return Config.getCandleExpireTime();
  },

  // 检测用户白标和当前访问的链接是否一致, 不一致则跳转
  _checkWL: function() {
    // 访问链接白标
    var wl = window.location.pathname.substring(1, window.location.pathname.indexOf('/s/'));

    if (wl == '' || wl == '/') {
      wl = 'firstbroker';
    }
    // 客户 Cookie 里保存的白标信息, 在 v4/user 下行里更新
    var wl_cookie = Cookie.get('wl');

    if (wl_cookie != undefined && wl_cookie != '' && wl_cookie != wl) {
      if (wl_cookie == 'firstbroker') {
        wl_cookie = '';
      }

      if (location.port == 8000 || location.port == 8080 || location.href.indexOf('waibao.invhero.com') != -1) {
        return;
      }

      // 注册和登录页不跳转
      if (window.location.pathname.indexOf('register.html') == -1 && window.location.pathname.indexOf('login.html') == -1) {
        window.location = window.location.origin + '/' + wl_cookie + window.location.href.substring(window.location.href.indexOf('/s/'));
      }
    }
  },

  _preBind: function() {
    var doc = $(document);

    // 此项是区分居间登录的关键 (Android 不做检测)
    if (!Config.isAndroidAPK()) {
      this._checkWL();
    }

    doc.on('click', '.J_VerifyLogin', $.proxy(this._verifyLogin, this));
    doc.on('tap', '.dialog-btn', function(e) {
      var curEl = $(e.currentTarget);
      curEl.addClass('active');
    });
  },

  _verifyLogin: function(e) {
    e.preventDefault();
    var url = $(e.currentTarget).attr('href');
    this.login().then(function() {
      location.href = url;
    });
  },

  clearLocalStorageSymbols: function () {

    if ( !storage.get('clearLocalStorage') ) {
      storage.clearAll();
      storage.set('clearLocalStorage',true);
      console.log('clear:LocalStorageSymbols')
    }

  },

  isDemo: function() {
    return Cookie.get('type') === 'demo' || !Cookie.get('type');
  },

  goReal: function() {
    return !!Cookie.get('goType');
  },

  getLogin: function() {
    return login;
  },

  getOption: function(symbols) {
    var self = this,
      d = new $.Deferred(),
      url = getUrl(),
      token = Cookie.get('token'),
      data = {
        access_token: token
      };

    if (Array.isArray(symbols)) {
      data.symbols = symbols.join(',');
    }


    this.ajax({
      url: url,
      data: data
    }).then(function(data) {

      d.resolve(data.data);
    });

    return new d.promise();

    function getUrl() {
      // 实盘  actual quotation
      var demo = self.isDemo();

      var url = demo ? '/v3/demo/symbols6' : '/v3/real/symbols6';
      return url;
    }
  },

  login: function() {
    return login.login();
  },

  getToken: function(redirectURL, supportAnony) {
    var self = this,
      deferred = new $.Deferred();

    var token = Cookie.get('token');

    // 获取到token的情况
    if (token) {
      deferred.resolve(token);
    }
    // 没有获取到token的情况
    else {
      if (supportAnony) {
        login.registerAnonymous().then(function(token) {
          deferred.resolve(token);
        });
      } else {
        window.location = redirectURL || getLoginWL();
      }
    }

    return deferred.promise();
  },

  getRealToken: function(showCancel) {
    var self = this,
      deferred = new $.Deferred();
    var realToken = Cookie.get('real_token');

    if (realToken) {
      deferred.resolve(realToken, true);
    } else {
      login.login().then(function() {
        self.getAccount().then(function(data) {
          var realAccount = data.account.real;
          if (!listenLogin) {
            login.on('get:realToken', function(realToken) {
              self.broadcast('get:realToken');
              deferred.resolve(realToken);
            });
            login.on('reject:realToken', function() {
              deferred.reject();
              self.broadcast('reject:realToken');
            });
            listenLogin = true;
          }

          if (!realAccount.trade_password) {
            login.showSetup();
          } else if (login.isExpire() || login.isFirst()) {
            if (!getSimulatePlate()) {
              window.location = getLoginWL();
            } else {
              login.showTrade(showCancel);
            }
          }
        });
      }, function() {
        deferred.reject();
      });
    }

    return deferred.promise();
  },
  // 获取当前价格
  getCurrentPrice: function(symbols, returnObj) {
    var self = this,
      type = this.isDemo() ? 'demo' : 'real',
      str,
      typeVal = typeof symbols;

    if (!Array.isArray(symbols)) {
      symbols = [symbols];
    }

    this.persistenSymbols(symbols);

    var prices = this.getPrice(symbols);

    if (prices) {
      var d = new $.Deferred();

      if (typeVal === 'string') {
        if (returnObj) {
          var obj = prices[0] || {};
          obj.price = _getPrice(obj);
        
          d.resolve(obj);
        } else {
          var item = prices[0];
          
          d.resolve(_getPrice(item));
        }

      } else {

        if (returnObj) {
          d.resolve(prices);
        }

        var list = {};
        $.each(prices, function(index, item) {
          var symbol = item.symbol;
          var price = _getPrice(item);
          list[symbol] = price;
        });
         
        d.resolve(list);
      }
      return new d.promise();
    }

    return Symbol.getQuoteKeys(symbols).then(function(symbolStr) {
      if (!symbolStr) {
        return [];
      }

      var hasCache = symbols.length === 1;

      // if (hasCache) {

      //   if (priceQueue.has(symbolStr)) {
      //     var d = new $.Deferred();

      //     priceQueue.add(symbolStr, d);

      //     return d.promise();
      //   } else {
      //     priceQueue.add(symbolStr);
      //   }
      // }

      console.log(symbolStr, Date.now())

      return self.ajax({
        // url: '/v1/symbol/price/',
        // 换个接口取价格
        url: self.priceUrl,
        // url: 'http://account.etgbroker.com/v2/symbol/price',
        data: {
          // access_token: Cookie.get('token'),
          symbol: symbolStr
        },
        unjoin: true
      }).then(function(data) {

        if (data && data.data) {

          try {

            (data.data || []).forEach((item) => {
              stomp.updatePrice({
                symbol: item.symbol,
                askPrice: item.ask_price[0],
                bidPrice: item.bid_price[0],
                lastPrice: item.last_price,
                bid_price: item.bid_price,
                ask_price: item.ask_price,
                received_time: item.received_time
              });
            });
          } catch (e) {}



          if (typeVal === 'string') {
            if (returnObj) {
              var obj = data.data[0] || {};
              obj.price = _getPrice(obj);
              return obj;
            } else {
              var item = data.data[0];

              return _getPrice(item);
            }
          }

          if (returnObj) {
            return data.data;
          }

          var list = {};
          $.each(data.data, function(index, item) {
            var symbol = item.symbol;
            var price = _getPrice(item);
            list[symbol] = price;
          });

          return list;
        }
      });
    });




    function _getPrice(item) {
      if (!item) {
        return '--';
      }

      if (item.ask_price && item.ask_price.length !== 0) {
        return item.ask_price[0];
      }

      if (item.bid_price && item.bid_price.length !== 0) {
        return item.bid_price[0];
      }


      return '--';
    }
  },
  // // 获取当前价格
  // getCurrentPrice: function(symbols, returnObj) {
  //   var self = this,
  //     type = this.isDemo() ? 'demo' : 'real',
  //     str,
  //     typeVal = typeof symbols;


  //   // if (!Array.isArray(symbols) || symbols.length === 1) {
  //   //   var symbol = Array.isArray(symbols) ? symbols[0] : symbols;

  //   //   // 价格缓存 100ms 
  //   //   if (Config.openCache() && cachePrice[symbol] && (Date.now() - cacheTime[symbol]) < Config.getCacheTime()) {
  //   //     var d = new $.Deferred();

  //   //     if (Array.isArray(symbols)) {
  //   //       d.resolve([cachePrice[symbol]]);
  //   //     } else {

  //   //       d.resolve(cachePrice[symbol]);
  //   //     }

  //   //     return d.promise();
  //   //   }
  //   // }

  //   if (!Array.isArray(symbols)) {
  //     symbols = [symbols];
  //   }
  //   // }



  //   var prices = this.getPrice(symbols);

  //   if (prices) {
  //     var d = new $.Deferred();

  //     if (typeVal === 'string') {
  //       if (returnObj) {
  //         var obj = prices[0] || {};
  //         obj.price = _getPrice(obj);
  //         d.resolve(obj);
  //       } else {
  //         var item = prices[0];

  //         d.resolve(_getPrice(item));
  //       }

  //     } else {

  //       if (returnObj) {
  //         d.resolve(prices);
  //       }

  //       var list = {};
  //       $.each(prices, function(index, item) {
  //         var symbol = item.symbol;
  //         var price = _getPrice(item);
  //         list[symbol] = price;
  //       });

  //       d.resolve(list);
  //     }
  //     return new d.promise();
  //   }


  //   return Symbol.getQuoteKeys(symbols).then(function(symbolStr) {
  //     if (!symbolStr) {
  //       return [];
  //     }

  //     var hasCache = symbols.length === 1;

  //     // if (hasCache) {

  //     //   if (priceQueue.has(symbolStr)) {
  //     //     var d = new $.Deferred();

  //     //     priceQueue.add(symbolStr, d, returnObj);

  //     //     return new d.promise();
  //     //   } else {
  //     //     priceQueue.add(symbolStr);
  //     //   }
  //     // }

  //     return self.ajax({
  //       // url: '/v1/symbol/price/',
  //       // 换个接口取价格
  //       url: self.priceUrl,
  //       // url: 'http://account.etgbroker.com/v2/symbol/price',
  //       data: {
  //         // access_token: Cookie.get('token'),
  //         symbol: symbolStr
  //       },
  //       unjoin: true
  //     }).then(function(data) {

  //       if (data && data.data) {
  //         if (typeVal === 'string') {
  //           var obj = data.data[0] || {};
  //           obj.price = _getPrice(obj);

  //           if (returnObj) {
  //             if (symbols[0]) {
  //               cachePrice[symbols[0]] = obj;
  //               cacheTime[symbols[0]] = Date.now();
  //             }

  //             hasCache && priceQueue.resolve(symbolStr, {
  //               data: obj,
  //               price: obj.price
  //             });

  //             return obj;
  //           } else {
  //             // var item = data.data[0];
  //             // var itemPrice = _getPrice(item);

  //             hasCache && priceQueue.resolve(symbolStr, {
  //               data: obj,
  //               price: obj.price
  //             });

  //             return obj.price;
  //           }
  //         }
  //         var list = {};
  //         $.each(data.data, function(index, item) {
  //           var symbol = item.symbol;
  //           var price = _getPrice(item);
  //           list[symbol] = price;
  //         });


  //         if (returnObj) {
  //           hasCache && priceQueue.resolve(symbolStr, {
  //             data: data.data,
  //             price: list
  //           });
  //           return data.data;
  //         }



  //         hasCache && priceQueue.resolve(symbolStr, {
  //           data: data.data,
  //           price: list
  //         });

  //         return list;
  //       }
  //     });
  //   });




  //   function _getPrice(item) {
  //     if (!item) {
  //       return '--';
  //     }
  //     if (item.ask_price && item.ask_price.length !== 0) {
  //       return item.ask_price[0];
  //     }

  //     if (item.bid_price && item.bid_price.length !== 0) {
  //       return item.bid_price[0];
  //     }

  //     return '--';
  //   }
  // },

  // 获取当前价格
  getCurrentPriceObject: function(symbols, returnObj) {
    var self = this,
      type = this.isDemo() ? 'demo' : 'real',
      str,
      typeVal = typeof symbols;

    if (!Array.isArray(symbols)) {
      symbols = [symbols];
    }


    var symbolArr = [];
    $.each(symbols, function(index, symbol) {
      symbolArr.push('quote.' + type + '_default' + '.' + symbol);
    });

    str = symbolArr.join(',');


    return this.ajax({
      // url: '/v1/symbol/price/',
      // 换个接口取价格
      url: this.priceUrl,
      // url: 'http://account.etgbroker.com/v2/symbol/price',
      data: {
        // access_token: Cookie.get('token'),
        symbol: str
      },
      unjoin: true
    }).then(function(data) {
      // return this.getCurrentPrice(symbols, true).then(function(data) {
      if (data && data.data) {
        if (typeVal === 'string') {
          if (returnObj) {
            var obj = data.data[0] || {};
            obj.price = _getPriceObject(obj);
            return obj;
          } else {
            var item = data.data[0];

            return _getPriceObject(item);
          }
        }

        if (returnObj) {
          return data.data;
        }

        var list = {};
        $.each(data.data, function(index, item) {
          var symbol = item.symbol;
          var price = _getPriceObject(item);
          list[symbol] = price;
        });

        return list;
      }
    });

    function _getPriceObject(item) {
      var p = new Object();
      if (!item) {
        return '--';
      }
      if (item.ask_price && item.ask_price.length !== 0) {
        p.ask_price = item.ask_price[0];
      }

      if (item.bid_price && item.bid_price.length !== 0) {
        p.bid_price = item.bid_price[0];
      }

      return p;
    }
  },


  /**
   * 判断品种当前状态, 需要显示的错误提示
   * symbol: 从2.2.2.4 接口获取的symbol对象
   * account: 从2.2.2.5 接口获取的account对象
   **/
  checkStatus: function(symbol, account) {
    var d = new $.Deferred(),
      self = this;

    var closeTime = symbol.close_time[0];
    var curaccount = this.isDemo() ? account.demo : account.real;
    var time = Date.now(),
      status = {};

    if (closeTime && time < Util.getTime(closeTime.end) && time > Util.getTime(closeTime.start)) {

      status = {
        tag: '休市',
        className: 'close',
        type: 'close',
        start: closeTime.end,
        closeTime: closeTime.start,
        reason: closeTime.reason
      };
      d.resolve(status);
    } else if (symbol.policy.real_enabled == '0' && symbol.policy.demo_enabled == '0') {
      status.tag = '不可交易';
      status.type = 'un-trade';
      d.resolve(status);
      // item.className = ''
    } else if (!this.isDemo() && symbol.policy.real_enabled == '0') {
      status.tag = '限模拟';
      status.className = 'simulate';
      status.type = 'simulate';
      d.resolve(status);
    } else {
      // 如果已经开仓了, 那么就不用检查余额不足了
      if (self.open) {
        d.resolve({});
      } else {
        var free_margin = curaccount.free_margin;
        this.calMarginWithMarketPrice(symbol, symbol.policy.min_vol, account).then(function(margin) {
          if (free_margin <= margin) {

            d.resolve({
              tag: '余额不足',
              type: 'more-money'
            });
          } else {
            d.resolve({});
          }
        });
      }
    }

    return d.promise();
  },

  /**
   * 输入交易账户, 交易品种, 交易量, 按当前市场价格计算占用保证金
   * symbol: 从2.2.2.4 接口获取的symbol对象
   * volume: 交易量, 单位 手(Lot)
   * account: 从2.2.2.5 接口获取的account对象
   **/
  calMarginWithMarketPrice: function(symbol, volume, account) {
    var self = this;
    // 获取品种的当前市场价格
    return this.getCurrentPrice(symbol.policy.symbol, true).then(function(price) {
      if ($.isArray(price)) {
        price = price[0];
      }

      var midPirce = price.price === '--' ? 0 : (parseFloat(price.bid_price[0]) + parseFloat(price.ask_price[0])) / 2;

      return self.getMargin(midPirce, symbol, volume, account);
    });
  },

  /**
   * 输入开仓价格, 交易账户, 交易品种, 交易量, 计算占用保证金
   * openPrice: 设定的开仓价格
   * symbol: 从2.2.2.4 接口获取的symbol对象
   * volume: 交易量, 单位 手(Lot)
   * account: 从2.2.2.5 接口获取的account对象
   **/
  getMargin: function(openPrice, symbol, volume, account) {
    var d = new $.Deferred(),
      self = this;

    var isDemo = this.isDemo() ? true : false;
    // 杠杆
    var max_leverage = isDemo ? symbol.policy.demo_max_leverage : symbol.policy.real_max_leverage;
    var account = isDemo ? account.demo : account.real;
    var currency = account.currency;
    var trading_leverage = account.leverage * symbol.policy.leverage_multiplier; // 这里的account.leverage是对应demo或者real账户的leverage
    var isHasFixedMargin = symbol.policy.margin_is_fixed == '1' ? true : false;

    trading_leverage = trading_leverage < max_leverage ? trading_leverage : max_leverage;

    // 品种成交价格
    var mid_price = openPrice,
      trading_currency = symbol.policy.trading_currency,
      trading_home_symbol = trading_currency;

    var trading_home_price = 0;

    // 如果该品种有固定保证金， 就用固定保证金计算
    // 
    if ( isHasFixedMargin ) {
      var fixed_margin_ratio = parseFloat(symbol.policy.fixed_margin_ratio);
      var fixed_margin = fixed_margin_ratio * volume;
      d.resolve(fixed_margin);
    } else {

      // 品种trading_currency于账户home_currency的报价
      if (trading_currency == currency) { //这里要根据当前账户类型选择real或者demo!!!!!!!!!!!
        trading_home_price = 1;

        d.resolve(margin());
      } else {
        trading_home_symbol = trading_currency + currency; //这里要根据当前账户类型选择real或者demo!!!!!!!!!!!
        var alg = 0;
        if (!Symbols.has(trading_home_symbol)) {
          trading_home_symbol = currency + trading_currency;
          alg = 1;
        }

        this.getCurrentPrice(trading_home_symbol, true).then(function(price) {
          if (alg == 0) {
            if (price && price.bid_price && price.ask_price) {
              trading_home_price = (parseFloat(price.bid_price[0]) + parseFloat(price.ask_price[0])) / 2;
              d.resolve(margin());
            }
          } else {
            // trading_home_symbol = currency + trading_currency;
            // self.getCurrentPrice(trading_home_symbol, true).then(function(price) {
            if (price && price.bid_price && price.ask_price) {
              trading_home_price = (parseFloat(price.bid_price[0]) + parseFloat(price.ask_price[0])) / 2;
              trading_home_price = 1 / trading_home_price;
              var marginVal = margin();
              d.resolve(marginVal);
            } else {
              d.reject();
            }
            // });
          }
        });
      }
    }

    function margin() {
      var margin = parseFloat(symbol.policy.lot_size) * volume * parseFloat(mid_price) / (parseFloat(trading_leverage) / parseFloat(trading_home_price));
      return margin;
    }


    return new d.promise();
  },

  getAccount: function() {
    var self = this;
    //var globalCachedAccount = null;
    //var globalGetAccountReqSent = false;
    //var globalGetAccountDefers = [];

    if (globalCachedAccount != null) {
      console.log("globalCachedAccount != null");
      var d = new $.Deferred();
      d.resolve(globalCachedAccount);
      return d;
    }

    if (globalGetAccountReqSent == true) {
      console.log("globalGetAccountReqSent == true");
      var d = new $.Deferred();
      globalGetAccountDefers.push(d);
      return d;
    }

    globalGetAccountReqSent = true;
    console.log("sending getAccountReqSent ... 591.");
    return this.ajax({
      url: '/v4/user/',
      data: {
        access_token: Cookie.get('token'),
        _r: Math.random()
      }
    }).then(function(data) {
      Cookie.set('wl', data.data.wl);
      if ( getSimulatePlate() ) {
        Cookie.set('demo_group', data.data.account.demo.group_name);
      }
      Cookie.set('real_group', data.data.account.real.group_name);
      // android机型需要将用户id传递给本地代码
      if (Config.isAndroidAPK()) {
        window.account && window.account.updateUid(data.data.id);
        var needSync = 0;
        if ( data.data.avatar.indexOf('http') == -1&&data.data.wl != 'jy168' ) {
          needSync = 1;
        }
        window.userinfo && window.userinfo.updateUserInfo(data.data.wl, Cookie.get('token'), needSync);
      }
      // 需要设置昵称
      if (data.data.nickname === '') {
        login._setNickname();
      }
  
      console.log("set globalCachedAccount.");
      globalCachedAccount = data.data;
      var arrayLength = globalGetAccountDefers.length;
      for (var i = 0; i < arrayLength; i++) {
        console.log("globalGetAccountDefers[" + i + "].resolve");
        globalGetAccountDefers[i].resolve(data.data);
      }
      globalGetAccountDefers = []

      return data.data;
    }, function(a, b) {
      console.log(a);

      return a;
    });
  },

  /**
   * 传入价格信息, 计算对应的止盈止损的金额, 用户下单UI
   * account 账户对象
   * cmd 交易类型 buy 或者 sell
   * symbol 商品对象
   * volume 交易量, 例如0.02
   * openPrice 开仓价格, 例如EURUSD开仓 1.10233
   * stopLoss 止损价格, 例如EURUSD止损 1.08000
   * takeProfit 止盈价格, 例如EURUSD止盈 1.20000
   *
   **/
  calMoney: function(account, symbol, volume, openPrice, stopLoss, takeProfit) {
    var d = new $.Deferred(),
      self = this;
    // 开仓价格与当前价格的价差, cmd还有挂单的可能性, 但是挂单没有浮动盈亏
    var stoploss_price_delta = 0;
    var takeprofit_price_delta = 0;


    if (stopLoss != 0) {
      stoploss_price_delta = stopLoss - openPrice;
      if (stoploss_price_delta > 0) {
        stoploss_price_delta = 0 - stoploss_price_delta;
      }
      /*
      if (symbol.cmd == 'buy') {
          stoploss_price_delta = stopLoss - openPrice;
      } else {
          stoploss_price_delta = openPrice - stopLoss;
      }
      */
    }
    if (takeProfit != 0) {
      takeprofit_price_delta = takeProfit - openPrice;
      if (takeprofit_price_delta < 0) {
        takeprofit_price_delta = 0 - takeprofit_price_delta;
      }
      /*
      if (symbol.cmd == 'buy') {
          takeprofit_price_delta = takeProfit - openPrice;
      } else {
          takeprofit_price_delta = openPrice - takeProfit;
      }
      */
    }


    // 品种trading_currency于账户home_currency的报价
    var trading_currency = symbol.policy.trading_currency;
    var trading_home_price = 0;
    var account = this.isDemo() ? account.demo : account.real;

    if (trading_currency == account.currency) { //这里要根据当前账户类型选择real或者demo!!!!!!!!!!!
      trading_home_price = 1;
      d.resolve(money());
    } else {
      var trading_home_symbol = trading_currency + account.currency; //这里要根据当前账户类型选择real或者demo!!!!!!!!!!!
      var alg = 0;
      if (!Symbols.has(trading_home_symbol)) {
        trading_home_symbol = account.currency + trading_currency;
        alg = 1;
      }

      this.getCurrentPrice(trading_home_symbol, true).then(function(price) {
        if (alg == 0) {
          if (price && price.bid_price && price.ask_price) {
            trading_home_price = (parseFloat(price.bid_price[0]) + parseFloat(price.ask_price[0])) / 2;
            d.resolve(money());
          }
        } else {
          //trading_home_symbol = account.currency + trading_currency;
          //self.getCurrentPrice(trading_home_symbol, true).then(function(price) {
          if (price && price.bid_price && price.ask_price) {
            trading_home_price = (parseFloat(price.bid_price[0]) + parseFloat(price.ask_price[0])) / 2;
            trading_home_price = 1 / trading_home_price;
            var moneyVal = money();
            d.resolve(moneyVal);
          } else {
            d.reject();
          }
          // });
        }
      });
    };

    function money() {
      return {
        takeProfit: parseFloat(takeprofit_price_delta) * parseFloat(symbol.policy.lot_size) * volume * parseFloat(trading_home_price),
        stopLoss: parseFloat(stoploss_price_delta) * parseFloat(symbol.policy.lot_size) * volume * parseFloat(trading_home_price)
      }
    }

    return d.promise();
  },

  /**
   * 计算默认交易量, 使用可用保证金的10%算
   *
   **/
  calVolume: function(symbol, account, preparedMargin) {
    var self = this;
    return this.calMarginWithMarketPrice(symbol, symbol.policy.min_vol, account).then(function(margin) {
      account = self.isDemo() ? account.demo : account.real;

      var maxMargin = preparedMargin;
      // getDefaultVolume() => r.js .1(使用可用保证金的10%算)
      preparedMargin = preparedMargin * (getDefaultVolume() || .1);

      var volume = getVolume(preparedMargin);
      var maxVolume = getVolume(maxMargin);


      return {
        volume: volume,
        maxVolume: maxVolume
      };

      function getVolume(hasMargin) {

        // 不够交易最小交易量的情况
        if (hasMargin < margin)
          return 0;
        var vol = hasMargin / margin;
        var min_vol = symbol.policy.min_vol;
        vol = vol * min_vol;
        if (min_vol < 1) {
          min_vol = 1 / min_vol;
          vol = vol.toFixed(min_vol.toString().length - 1);
        } else {
          vol = parseInt(vol / min_vol);
        }

        vol = vol > parseFloat(symbol.policy.max_vol) ? symbol.policy.max_vol : vol;

        return vol;
      }
    });
  },

  getCurrentOrderList: function(type) {
    var self = this,
      type = type || (this.isDemo() ? 'demo' : 'real');

    if (type === 'demo') {
      return this._getCurrentOrderList(type);
    }

    return this.getRealToken().then(function(realToken) {
      return self._getCurrentOrderList(type, realToken);
    }, function() {
      var a = 1;
    });
  },

  _getCurrentOrderList: function(type, realToken) {
    var self = this;

    var data = {
      access_token: Cookie.get('token'),
      _r: Math.random()
    };


    if (type === 'real') {
      data.real_token = realToken;
    }

    if (!this.__orderQueue) {
      this.__orderQueue = [];
    }

    // if (tagCache[type]) {

    //   var d = new $.Deferred();
    //   this.__orderQueue.push(d);

    //   return d.promise();
    // }

    // tagCache[type] = true;

    return this.ajax({
      // url: '/v1/orders/' + type + '/current',
      url: '/v1/orders/' + type + '/current/mobtrade',
      data: data
    }).then(function(data) {
      var margin = 0,
        profit = 0,
        symbols = [];

      $.each(data.data, function(index, item) {
        var symbol = item.symbol;
        if (symbols.indexOf(symbol) === -1) {
          symbols.push(symbol);
        }
        margin += parseFloat(item.margin);
        profit += parseFloat(item.profit);
      });

      // 记录当前订单列表

      // self.orderList = {
      //     list: data.data,
      //     symbols: symbols,
      //     margin: margin,
      //     profit: profit
      // };

      var result = {
        list: data.data,
        symbols: symbols,
        margin: margin,
        profit: profit
      };

      // if (this.__orderQueue && this.__orderQueue.length) {
      //   this.__orderQueue.forEach((d) => {
      //     setTimeout(() => {
      //       d.resolve(result);
      //     }, 0);

      //   });

      //   this.__orderQueue.length = 0;

      // }

      // tagCache[type] = false;


      return result;

    }, function(e) {
      if (e.status === 1403) {
        // login.passwordDialog.show();
      }
    });
  },

  getHistoryOrderList: function(type) {
    var self = this,
      type = type || (this.isDemo() ? 'demo' : 'real');

    if (type === 'demo') {
      return this._getHistoryOrderList(type);
    }

    return this.getRealToken().then(function(realToken) {
      return self._getHistoryOrderList(type, realToken);
    });
  },

  _getHistoryOrderList: function(type, realToken) {
    var self = this;

    var data = {
      access_token: Cookie.get('token'),
      _r: Math.random()
    };

    if (type === 'real') {
      data.real_token = realToken;
    }

    return this.ajax({
      url: '/v1/orders/' + type + '/history',
      data: data
    }).then(function(data) {
      var margin = 0,
        profit = 0,
        symbols = [];

      $.each(data.data, function(index, item) {
        var symbol = item.symbol;
        if (symbols.indexOf(symbol) === -1) {
          symbols.push(symbol);
        }
        margin += parseFloat(item.margin);
        profit += parseFloat(item.profit);
      });

      return {
        list: data.data,
        symbols: symbols,
        margin: margin,
        profit: profit
      };

    }, function(e) {
      if (e.status === 1403) {
        // login.passwordDialog.show();
      }
    });
  },

  getHistoryOrderCollList: function(type) {
    var self = this,
      type = type || (this.isDemo() ? 'demo' : 'real');

    if (type === 'demo') {
      return this._getHistoryOrderCollList(type);
    }

    return this.getRealToken().then(function(realToken) {
      return self._getHistoryOrderCollList(type, realToken);
    });
  },

  _getHistoryOrderCollList: function(type, realToken) {
    var self = this;

    var data = {
      access_token: Cookie.get('token'),
      _r: Math.random()
    };

    if (type === 'real') {
      data.real_token = realToken;
    }

    return this.ajax({
      url: '/v1/orders/' + type + '/history/mobtrade/summary/',
      data: data
    }).then(function(data) {
      return data;
      // var margin = 0,
      //   profit = 0,
      //   symbols = [];

      // $.each(data.data, function(index, item) {
      //   var symbol = item.symbol;
      //   if (symbols.indexOf(symbol) === -1) {
      //     symbols.push(symbol);
      //   }
      //   margin += parseFloat(item.margin);
      //   profit += parseFloat(item.profit);
      // });

      // return {
      //   list: data.data,
      //   symbols: symbols,
      //   margin: margin,
      //   profit: profit
      // };

    }, function(e) {
      if (e.status === 1403) {
        // login.passwordDialog.show();
      }
    });
  },

  getHistoryOrderAloList: function(expertId) {
    var self = this,
      type = type || (this.isDemo() ? 'demo' : 'real');

    if (type === 'demo') {
      return this._getHistoryOrderAloList(type, '', expertId);
    }

    return this.getRealToken().then(function(realToken) {
      return self._getHistoryOrderAloList(type, realToken, expertId);
    });
  },

  _getHistoryOrderAloList: function(type, realToken, expertId) {
    var self = this;

    var data = {
      access_token: Cookie.get('token'),
      follow_id: expertId,
      _r: Math.random()
    };

    if (type === 'real') {
      data.real_token = realToken;
    }

    return this.ajax({
      url: '/v1/orders/' + type + '/history/mobtrade/list/',
      data: data
    }).then(function(data) {
      return data;
      var margin = 0,
        profit = 0,
        symbols = [];

      $.each(data.data, function(index, item) {
        var symbol = item.symbol;
        if (symbols.indexOf(symbol) === -1) {
          symbols.push(symbol);
        }
        margin += parseFloat(item.margin);
        profit += parseFloat(item.profit);
      });

      return {
        list: data.data,
        symbols: symbols,
        margin: margin,
        profit: profit
      };

    }, function(e) {
      if (e.status === 1403) {
        // login.passwordDialog.show();
      }
    });
  },

  // 计算单点价值
  getPipValue: function(symbolPolicy, prices, type) {
    var d = new $.Deferred(),
      symbol = symbolPolicy.symbol,
      current_price = prices,
      policy = symbolPolicy;

    // 如果从服务器没有获得某品种的价格, 那么就单点价值为 $10
    if (!current_price) {
      d.resolve(10);
      return d.promise();
    }

    // 品种trading_currency于账户home_currency的报价
    var trading_currency = policy.trading_currency;
    var trading_home_price = 0;

    var pipValue = policy.pip * policy.lot_size;


    if (trading_currency == this.account[type].currency) { //这里要根据当前账户类型选择real或者demo!!!!!!!!!!!
      trading_home_price = 1;
      d.resolve(pipValue);
    } else {
      var self = this;
      var trading_home_symbol = trading_currency + this.account[type].currency; //这里要根据当前账户类型选择real或者demo!!!!!!!!!!!

      var alg = 0;
      if (!Symbols.has(trading_home_symbol)) {
        trading_home_symbol = this.account[type].currency + trading_currency;
        alg = 1;
      }

      this.getCurrentPrice(trading_home_symbol, true).then(function(temp_price) {
        if (alg == 0) {
          if (temp_price && temp_price.bid_price) {
            trading_home_price = parseFloat(temp_price.bid_price[0]);

            // trading_home_price = (parseFloat(temp_price.bid_price[0]) + parseFloat(temp_price.ask_price[0]) )/ 2;
            d.resolve(pipValue * trading_home_price);
          }
        } else {
          // trading_home_symbol = self.account[type].currency + trading_currency; //这里要根据当前账户类型选择real或者demo!!!!!!!!!!!
          // self.getCurrentPrice(trading_home_symbol, true).then(function(temp_price) {
          // temp_price = self.getCurrentPrice(trading_home_symbol, account.type);
          if (temp_price && temp_price.ask_price) {

            trading_home_price = parseFloat(temp_price.ask_price[0]);

            // trading_home_price = (parseFloat(temp_price.bid_price[0]) + parseFloat(temp_price.ask_price[0])) / 2;
            trading_home_price = 1 / trading_home_price;
            d.resolve(pipValue * trading_home_price);
          } else {
            d.resolve(10);
          }
          // });
        }
      });
    }
    return d.promise();
  },


  /**
   * 传入账户信息, 订单信息, 计算当前持仓的浮动盈亏  1个订单
   *
   * @param {Boolean} returnObj 返回每个订单的浮动盈亏  默认返回全部
   */
  getFloatingProfit: function(account, orderList, symbols) {
    var deferred = new $.Deferred(),
      self = this,
      orderLen = orderList.length,
      mainProfit = 0,
      floatList = {},
      count = 0,
      type = self.isDemo() ? 'demo' : 'real';

    if (orderLen === 0) {
      deferred.resolve(0);
    }

    groupName = account;



    this.getCurrentPrice(symbols, true).then(function(prices) {
      Symbol.get(symbols).then(function(optionList) {
        try {
          var deferreds = getProfitList(optionList, prices, orderList);
        } catch (e) {}
        $.when.apply($, deferreds).done(function() {
          // console.log('deferreds')
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
        policy = getSym(optionList, symbol).policy,
        // 在这里取是因为针对买涨买跌应该取不同的价格, 这里最方便
        ba = self.bottomAccount == undefined ? self : self.bottomAccount;

      // 如果从服务器没有获得某品种的价格, 那么就不做计算
      if (!current_price) {
        d.resolve(0);
        return d.promise();
      }


      // 开仓价格与当前价格的价差, cmd还有挂单的可能性, 但是挂单没有浮动盈亏
      var price_delta = 0;
      if (item.status == 'open' && item.cmd.indexOf('buy') != -1) {
        price_delta = current_price.bid_price[0] - item.openPrice;

        // 尝试解决当前订单列表中每个订单当前价格的更新问题
        if (ba.prices) {
          ba.prices[policy.symbol] = current_price.bid_price[0];
        }
      } else if (item.status == 'open' && item.cmd.indexOf('sell') != -1) {
        price_delta = item.openPrice - current_price.ask_price[0];
        // 尝试解决当前订单列表中每个订单当前价格的更新问题
        if (ba.prices) {
          ba.prices[policy.symbol] = current_price.ask_price[0];
        }
      }

      // 品种trading_currency于账户home_currency的报价
      var trading_currency = policy.trading_currency;
      var trading_home_price = 0;

      if (trading_currency == account[type].currency) { //这里要根据当前账户类型选择real或者demo!!!!!!!!!!!
        trading_home_price = 1;
        d.resolve(profit(trading_home_price, item));
      } else {

        var trading_home_symbol = trading_currency + account[type].currency; //这里要根据当前账户类型选择real或者demo!!!!!!!!!!!

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

              // trading_home_price = (parseFloat(temp_price.bid_price[0]) + parseFloat(temp_price.ask_price[0]) )/ 2;
              d.resolve(profit(trading_home_price, item));
            }
          } else {
            // trading_home_symbol = account[type].currency + trading_currency; //这里要根据当前账户类型选择real或者demo!!!!!!!!!!!
            // self.getCurrentPrice(trading_home_symbol, true).then(function(temp_price) {
            // temp_price = self.getCurrentPrice(trading_home_symbol, account.type);
            if (temp_price && temp_price.ask_price) {

              trading_home_price = parseFloat(temp_price.ask_price[0]);

              // trading_home_price = (parseFloat(temp_price.bid_price[0]) + parseFloat(temp_price.ask_price[0])) / 2;
              trading_home_price = 1 / trading_home_price;
              d.resolve(profit(trading_home_price, item));
            } else {
              d.resolve(profit(0, item));
            }
            // });
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
  },

  // getAvatarPrefix: function(src) {
  //     if (Util.isDaily()) {
  //         return  Config.ajaxPrefix + src;
  //     } else {
  //         return '//static.invhero.com/' + src.slice(7);
  //     }
  // },

  cookie: Cookie,
  getPrice: function(symbols) {
    return stomp.getPrice(symbols, groupName);
    // if (Util.supportWebsocket()) {
    //     if (!this.symbolStompObj) {
    //         this.symbolStompObj = new Stomp({
    //             symbols: symbols
    //         });

    //         console.log('stomp')
    //     }

    //     this.symbolStompObj.add(symbols);

    //     var prices = this.symbolStompObj.get(symbols);

    //     if (prices) {
    //         return prices;
    //     }
    // }
  }
});

module.exports = PageBase;
