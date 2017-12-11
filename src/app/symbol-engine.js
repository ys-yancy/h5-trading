var Base = require('./base');

function SymbolEngine(token) {
  // 存在的货币品种
  this._existSymbols = new Array('XW1USD', 'EURRUB', 'NZDSGD', 'GBPSGD', 'GBPTRY', 'GBPPLN',
    'GBPDKK', 'GBPNOK', 'GBPHUF', 'GBPZAR', 'GBPMXN', 'GBPHKD',
    'EURZAR', 'EURSGD', 'EURMXN', 'EURHKD', 'HKDJPY', 'EURDKK',
    'NOKJPY', 'SEKJPY', 'TRYJPY', 'SGDJPY', 'ZARJPY', 'EURHUF',
    'EURNOK', 'CHFSEK', 'CHFNOK', 'GBPSEK', 'EURPLN', 'EURTRY',
    'NZDCAD', 'NZDCHF', 'CADCHF', 'EURSEK', 'USDNOK', 'USDRUB',
    'AUDCHF', 'USDSGD', 'USDDKK', 'CHFJPY', 'USDHUF', 'EURNZD',
    'CADJPY', 'USDPLN', 'AUDCAD', 'GBPCHF', 'GBPNZD', 'GBPCAD',
    'USDSEK', 'AUDNZD', 'USDMXN', 'USDZAR', 'USDTRY', 'EURCAD',
    'USDHKD', 'EURAUD', 'GBPAUD', 'USDCAD', 'NZDUSD', 'EURGBP',
    'EURCHF', 'AUDUSD', 'AUDJPY', 'GBPJPY', 'EURJPY', 'NZDJPY',
    'USDCHF', 'GBPUSD', 'USDJPY', 'EURUSD', 'GBPCZK', 'EURCZK',
    'USDCNH', 'USDCZK', 'XAUAUD', 'XAUUSD', 'XAGAUD', 'XAGUSD',
    'XNGUSD');

  // 当前维护的symbol列表
  // {
  //      'EURUSD': {
  //                  'quote':
  //                  'close_time':
  //                  'policy':
  //                  'close_price':
  //                 }
  //  }
  this._currentSymbols = {};

  // 模拟账户刷新时间, 单位毫秒
  this._demoInterval = 2000;

  // 实盘账户刷新时间, 单位毫秒
  this._realInterval = 1000;

  // 当前账户, 默认为demo, 可以为real
  this._currentAccount = getSimulatePlate() ? 'demo' : 'real';

  // 登录token
  this._token = token;

  // 自动获取
  this._isRefreshing = false;

  // 当前刷新时间, 单位毫秒, 注意是每次请求回来之后过_interval时间再发
  this._interval = this._demoInterval;

}

Base.extend(SymbolEngine, Base, {
  /**
   * 设置token
   * @param token 用户登录token
   */
  setToken: function(token) {
    if (token) {
      this._token = token;
    }
  },

  /**
   * 设置刷新时间
   * @param demo 模拟账户刷新时间, 单位毫秒
   * @param real 实盘账户刷新时间, 单位毫秒
   */
  setIntervalTime: function(demo, real) {
    if (demo > 0) {
      this._demoInterval = demo;
    }
    if (real > 0) {
      this._realInterval = real;
    }
  },

  /**
   * 检查是否为存在的货币品种
   * @param symbol 需要查找是否存在的币种
   */
  checkSymbolExist: function(symbol) {
    if (!symbol) {
      return false;
    }
    for (var i = 0; i < this._existSymbols.length; i++) {
      if (this._existSymbols[i] === symbol) {
        return true;
      }
    }
    return false;
  },

  /**
   * 切换账户类型, 会引起清空所有symbol缓存重新获取
   * @param accountMode 账户类型 demo|real
   */
  setAccountMode: function(accountMode) {

    if (this._currentAccount != accountMode) {
      this._currentAccount = accountMode;
      // 切换账户需要切换刷新时间
      this._interval = this._interval == this._demoInterval ? this._realInterval : this._demoInterval;

      // 切换账户需要更新_currentSymbols
      if (this._isRefreshing) {
        this._isRefreshing = false;
      }

      var self = this,
        symbols = new Array;

      for (var s in this._currentSymbols) {
        symbols.push(s);
      }

      this._currentSymbols = {};

      this.getSymbolsV3(symbols).then(function(data) {
        // 需要刷新
        self._isRefreshing = true
          // self._currentSymbols = data;
      });

      this.startRefresh();
    }
  },

  /**
   * 启动动态刷新价格机制
   *
   */
  startRefresh: function() {
    // 如果当前没有刷新 且 有品种信息, 那么需要启动价格刷新
    if (!this._isRefreshing && this._currentSymbols && this._currentSymbols.length != 0) {
      this._isRefreshing = true;
      setTimeout($.proxy(this._getCurrentPriceFromServer, this), this._interval);
      return true;
    }
    return false;
  },
  /**
   * 获取一系列品种的策略
   * @param symbols symbol数组 或者 传入 'fav'
   * @return {'EURUSD':V3Object, 'GBPUSD': V3Object}
   */
  getSymbolsV3: function(symbols) {
    var deferred = $.Deferred(),
      re = {},
      self = this,
      nonExsitSymbols = new Array();
    // 默认从本地列表里取
    if (!symbols)
      return undefined;

    // 首次读取用户关注品种
    if (symbols === 'fav') {
      this._getV3ObjectFromServer(null).then(function(data) {
        deferred.resolve(data);
      });
    }
    // 提供具体品种列表
    else {
      for (var i = 0; i < symbols.length; i++) {
        // 本地缓存有数据
        if (this._currentSymbols[symbols[i]]) {
          re[symbols[i]] = this._currentSymbols[symbols[i]];
        } else {
          nonExsitSymbols.push(symbols[i]);
        }
      }
      self.re = re;
      // 本地没有的就从服务器取
      this._getV3ObjectFromServer(nonExsitSymbols).then(function(data) {
        data = $.merge(data, self.re);
        deferred.resolve(data);
      });
    }
    return deferred.promise();
  },

  /**
   * 获取一系列品种的价格
   * @param symbols symbol数组
   * @return {'EURUSD':QuoteObject, 'GBPUSD': QuoteObject}
   */
  getCurrentPrice: function(symbols) {
    var deferred = $.Deferred(),
      re = {},
      self = this,
      nonExsitSymbols = new Array();
    // 默认从本地列表里取
    if (!symbols)
      return undefined;
    for (var i = 0; i < symbols.length; i++) {
      // 本地缓存有数据
      if (this._currentSymbols[symbols[i]]) {
        re[symbols[i]] = this._currentSymbols[symbols[i]].quote;
      } else {
        nonExsitSymbols.push(symbols[i]);
      }
    }
    self.re = re;
    self.nonExsitSymbols = nonExsitSymbols;
    // 本地没有的就从服务器取
    this._getV3ObjectFromServer(nonExsitSymbols).then(function(data) {
      for (var i = 0; i < self.nonExsitSymbols.length; i++) {
        self.re[self.nonExsitSymbols[i]] = data[self.nonExsitSymbols[i]].quote;
      }
      deferred.resolve(self.re);
    });
    return deferred.promise();
  },

  /**
   * 从v3接口获取下行数据
   * @param symbols symbol数组
   * @return {'EURUSD':V3Object, 'GBPUSD': V3Object}
   */
  _getV3ObjectFromServer: function(symbols) {
    var deferred = $.Deferred(),
      self = this,
      str = "";

    if (!symbols || symbols.length == 0) {
      str = 'fav';
    } else {
      for (var i = 0; i < symbols.length; i++) {
        str += symbols[i] + ','
      }
      // 拿掉最后一个 , 
      str = str.substr(0, str.length - 1);
    }

    this.ajax({
      url: '/v3/' + this._currentAccount + '/symbols6/',
      data: {
        access_token: this._token,
        symbols: str,
        f: 'se',
        _r: Math.random()
      }
    }).then(function(data) {
      // 处理服务器下行
      data = data.data;
      var re = {};
      // 取回来的数据更新到本地列表
      for (var i = 0; i < data.length; i++) {
        re[data[i].policy.symbol] = data[i];
        if (!self._currentSymbols[data[i].policy.symbol]) {
          self._currentSymbols[data[i].policy.symbol] = data[i];
        }
      }
      deferred.resolve(re);
    });

    return deferred.promise();
  },

  /**
   * 从/v1/symbol/price接口获取下行数据
   * @param symbols symbol数组
   * @return {'EURUSD':PriceObject, 'GBPUSD': PriceObject}
   */
  _getCurrentPriceFromServer: function(symbols) {
    // 组建价格字符串
    var deferred = $.Deferred(),
      str = "",
      self = this;

    // 提供symbols列表的情况
    if (symbols && symbols.length != 0) {
      for (var i = 0; i < symbols.length; i++) {
        str += this._currentSymbols[symbols[i]].policy.quote_sub_routing_key + ",";
      }
    }
    // 刷新全部数据的情况
    else {
      for (var s in this._currentSymbols) {
        str += this._currentSymbols[s].policy.quote_sub_routing_key + ",";
      }
    }
    // 拿掉最后一个 , 
    str = str.substr(0, str.length - 1);

    // 从服务器端获取价格
    this.ajax({
      // 换个接口获取价格
      url: this.priceUrl,
      // url: 'http://account.etgbroker.com/v2/symbol/price',
      data: {
        access_token: this._token,
        symbol: str,
        f: 'se',
        _r: Math.random()
      },
      unjoin: true
    }).then(function(data) {
      self.re = {};
      // 处理服务器下行价格
      if (data && data.data) {
        for (var i = 0; i < data.data.length; i++) {
          // 更新本地存储
          if (self._currentSymbols[data.data[i].symbol]) {
            self._currentSymbols[data.data[i].symbol].quote = data.data[i];
          }
          // 发给请求者
          self.re[data.data[i].symbol] = data.data[i];
        }
      }
      deferred.resolve(self.re);

      // 自动刷新价格
      if (self._isRefreshing)
        setTimeout($.proxy(self._getCurrentPriceFromServer, self), self._interval);
    });
    return deferred.promise();
  }

});

module.exports = SymbolEngine;
