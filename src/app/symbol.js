var cacheSymbols = {
  demo: {},
  real: {}
};

var emptySymbols = {
  demo: {},
  real: {}
};

var Cookie = require('../lib/cookie');
var IO = require('./io');
var Uri = require('./uri');
var session = require('./session');
var storage = require('./storage');
/**
 * 降低对V3接口的依赖，缓存V3返回的数据
 */

module.exports = {
  get: function(symbols) {
    var deferred = new $.Deferred(),
      self = this;;

    var optionList = this._get(symbols);

    // 如果存在直接读取缓存
    if (optionList) {
      deferred.resolve(optionList);
    } else {
      var url = this._getUrl(),
        token = Cookie.get('token'),
        data = {
          access_token: token || '',
          invite_code: new Uri().getParam('inviteCode')
        };

      var type = this._getType();
      var cache = emptySymbols[type];

      var group = session.get('group');

      if (group && group[type]) {
        var grounName = group[type].group_name;

        data.group_name = grounName;
      } else {
        data.group_name = 'real_default';
      }

      // if (symbols.length === 1) {
      //     var mySymbol = symbols[0];

      //     if (cache[mySymbol]) {
      //         deferred.resolve([]);

      //         return new deferred.promise();
      //     }
      // }
      var symbolsArray = [];

      symbols.forEach((symbol) => {
        if (!cache[symbol]) {
          symbolsArray.push(symbol);
        }
      });

      if (symbolsArray.length === 0) {
        deferred.resolve([]);

        return new deferred.promise();
      } else {
        var optionList = this._get(symbolsArray);
        if (optionList) {
          deferred.resolve(optionList);
          return new deferred.promise();
        }
      }

      // if (Array.isArray(symbols)) {
      data.symbols = symbolsArray.join(',');
      // }
      data.format='json';
      if (data.symbols.length > 0) {
        IO.ajax({
          url: getSymbolUrl(),
          data: data,
          unjoin: true,
        }).then((data) => {
          self._save(data.data);

          var type = this._getType();

          var cache = emptySymbols[type];

          symbols.forEach((symbol) => {
            if (!this._inSymbol(data.data, symbol)) {
              cache[symbol] = true;
            }
          });

          deferred.resolve(data.data);
        });
      }
    }

    return new deferred.promise();
  },

  _inSymbol: function(data, symbol) {
    var inArray = false;
    data.forEach((item) => {
      if (item.policy.symbol === symbol) {
        inArray = true;
      }
    });

    return inArray;
  },

  getQuoteKeys: function(symbols) {
    var deferred = new $.Deferred(),
      self = this,
      list = [];

    return this.get(symbols).then(function(optionList) {
      $.each(optionList, function(index, item) {
        list.push(item.policy.quote_sub_routing_key);
      });

      return list.join(',')
    });

  },

  _get: function(symbols) {
    var type = this._getType();

    var cache = cacheSymbols[type];
    var optionList = [];

    for (var i = 0, len = symbols.length; i < len; i++) {
      var symbol = symbols[i];
      if (cache[symbol]) {
        optionList.push(cache[symbol]);
      } else {
        return undefined;
      }
    }

    return optionList;
  },

  _save: function(optionList) {
    var type = this._getType();
    var cache = cacheSymbols[type];

    for (var i = 0, len = optionList.length; i < len; i++) {
      if (!cache[optionList[i].policy.symbol]) {
        cache[optionList[i].policy.symbol] = optionList[i];
      }
    }

    this._saveLocal(optionList);
  },

  _saveLocal: function(optionList) {
    var type = Cookie.get('type') === 'demo' ? 'demo' : 'real';
    var token = Cookie.get('token');

    var key = `${token}:${type}:symbols`;

    var mySymbols = storage.get(key);

    try {

      if (mySymbols) {
        mySymbols = JSON.parse(mySymbols);
      } else {
        mySymbols = [];
      }

      for (var i = 0, len = optionList.length; i < len; i++) {
        var symbol = optionList[i].policy.symbol;
        if (mySymbols.indexOf(symbol) === -1) {
          mySymbols.push(symbol);
        }
      }

      storage.set(key, mySymbols);
    } catch (e) {}
  },

  save: function(optionList) {
    this._save(optionList);
  },

  _getType: function() {
    return Cookie.get('type') === 'demo' ? 'demo' : 'real';
  },

  _getUrl: function() {
    // 实盘  actual quotation
    var demo = Cookie.get('type') === 'demo';

    var url = demo ? '/v3/demo/symbols6' : '/v3/real/symbols6';

    return url;
  }
};
