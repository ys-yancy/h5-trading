require('../../lib/sock');
require('../../lib/frame');
var Config = require('../../app/config');
var Cookie = require('../../lib/cookie');
var Base = require('../../app/base');
var Uri = require('../../app/uri');
var session = require('../../app/session');
var queue = [];
var hasRequest = false;

export default class StompProtocal extends Base {
  constructor(config) {
    super(config);

    this.groupNameCache = config.groupName;

    // this.symbols = ['BTCUSD']
    this.symbols = this.symbols || [];
    this.receiveSymbols = [];
    this.realSymbols = [];
    this.stompSubSuccess = false;
    this.count = 0;

    if (!this.groupNameCache) {

      var demoGroup = Cookie.get('demo_group');
      var realGroup = Cookie.get('real_group');

      if (demoGroup && realGroup) {
        this.groupNameCache = {
          real: {
            group_name: realGroup
          },
          demo: {
            group_name: demoGroup
          }
        }

      }
    }
    this.connect();
    this.prices = {};
    this._bind();
  }

  _bind() {

  }

  getGroupName() {
    var self = this;
    var d = new $.Deferred();

    var type = Cookie.get('type') === 'demo' ? 'demo' : 'real';
    if (this.groupNameCache) {
      d.resolve(this.groupNameCache[type].group_name);
      return new d.promise();
    }

    var group = session.get('group');
    if (group) {
      this.groupNameCache = group;
      d.resolve(this.groupNameCache[type].group_name);
      return new d.promise();
    }

    // if (hasRequest) {
    //   queue.push(d);
    //   return new d.promise();
    // }

    hasRequest = true;
    this.ajax({
      url: '/v1/user/',
      data: {
        access_token: Cookie.get('token') || '',
        invite_code: new Uri().getParam('inviteCode')
      }
    }).then((data) => {
      data = data.data;

      self.groupNameCache = data.account;
      d.resolve(data.account[type].group_name);

      queue.length && queue.forEach((promise) => {
        promise.resolve(data.account[type].group_name);
      });
      queue.length = 0;
      // d.resolve(self.groupNameCache[type].group_name);
    });

    return new d.promise();
  }

  connect() {
    var self = this;
    var login = "gooduser";
    var passcode = "passwd1";
    var host = "localhost"
    var url = getRtpriceSompUrl();

    this.client && this.client.disconnect();
    this.onopen = false;


    var client = Stomp.client(url);
    client.heartbeat.incoming = Config.getInterval();
    var i = 0;
    var onmessage = (message) => {
      try {
        var body = JSON.parse(message.body);

        var data = body.d.split(',');
        var params = {
          symbol: data[0],
          askPrice: data[1],
          bidPrice: data[3],
          lastPrice: data[5],
          bid_price: [data[3]],
          ask_price: [data[1]],
          received_time: data[7]
        };


        self.fire('update', params);
        self.broadcast('stomp:price:update', params);
        this.updatePrice(params);
      } catch (e) {}
    }

    var connect_callback = () => {
      var type = Cookie.get('type') === 'demo' ? 'demo' : 'real';
      self.stompSubSuccess = true;
      self.realSymbols.length = 0;
      this.getGroupName().then((groupName) => {
        for (var i = 0, len = this.symbols.length; i < len; i++) {
          self.realSymbols.push(this.symbols[i]);
          // console.log('quote.' + groupName + '.' + this.symbols[i]);
          try {
            client.subscribe('quote.' + groupName + '.' + this.symbols[i] + '?format=v2&throttle=1', onmessage);
          } catch (e) {}
        }
      });
    };
    var error_callback = function(error) {
      // console.log(error);
    };
    client.connect(login, passcode, connect_callback, error_callback, host);
    client.onopen = () => {
      this.onopen = true;
    }

    this.client = client;
    var S = setTimeout(()=> {
      if ( !self.stompSubSuccess ) {
        // 如果三秒内没获取到stomp  则重新连接
        self.connect();
        clearTimeout(S);
        S = null;
      }
    },3000)
  }

  add(symbols) {
    var newSymbol = false;
    var newSymbols = [];

    if (typeof symbols === 'string') {
      symbols = [symbols];
    }

    symbols.forEach((symbol) => {
      if (this.symbols.indexOf(symbol) === -1) {
        this.symbols.push(symbol);
        newSymbol = true;

        newSymbols.push(symbol);
      }
    });

    if (!this.client) {
      this._connect();
      return;
    }

    if (newSymbol) {
      // this._connect();
      this._add(newSymbol);
    }
  }

  _add(symbols) {
    var type = Cookie.get('type') === 'demo' ? 'demo' : 'real';

    var onmessage = (message) => {
      try {
        var body = JSON.parse(message.body);

        var data = body.d.split(',');
        var params = {
          symbol: data[0],
          askPrice: data[1],
          bidPrice: data[3],
          lastPrice: data[5],
          bid_price: [data[3]],
          ask_price: [data[1]]
        };

        // console.log(params);

        this.fire('update', params);
        this.broadcast('stomp:price:update', params);
        this.updatePrice(params);
      } catch (e) {}
    }

    this.getGroupName().then((groupName) => {
      for (var i = 0, len = symbols.length; i < len; i++) {
        try {
          this.client.subscribe('quote.' + groupName + '.' + symbols[i] + '?format=v2&throttle=1', onmessage);
        } catch (e) {}
      }
    });
  }

  _connect() {
    // if (this.onopen) {
    console.log(this.count++)
    try {
      if (!this.client) {
        this.connect();
        return;
      }
      // console.log(this.client.ws.readyState);

      if (this.client.ws.readyState === 1) {
        this.connect();
        return;
      }
    } catch (e) {
      clearTimeout(this.timer);

      this.timer = setTimeout(() => {
        this._connect();
      }, 100);

    }
    // }


  }

  // updatePrice(params) {
  //   var symbol = params.symbol;

  //   this.prices[symbol] = params;
  // }

  updatePrice(params) {
    var symbol = params.symbol;

    // 过期时间
    params.expired = (new Date()).getTime() + Config.getExpiredTime();

    this.prices[symbol] = params;
  }

  _check() {
    setTimeout(() => {
      this.check();
      this._check();
    }, Config.getExpiredTime());
  }

  // 如果过期了，则删除价格
  check() {
    // 如果10s后还是未建立。则重新建链接
    if (!this.client.connected) {
      setTimeout(() => {
        if (!this.client.connected) {
          this.connect();
        }
      }, 10 * 1000);
    }

    var time = (new Date()).getTime();
    for (var symbol in this.prices) {
      if (this.prices.hasOwnProperty(symbol)) {
        if (this.prices[symbol] && time > this.prices[symbol].expired) {
          delete this.prices[symbol];
        }
      }
    }
  }

  get(symbols) {
    var prices = [];
    var all = true;
    var newSymbols = [];
    if (typeof symbols === 'string') {
      symbols = [symbols];
    }
    symbols.forEach((symbol) => {
      if (!this.prices[symbol]) {
        all = false;
      } else {
        prices.push(this.prices[symbol]);
      }

      if (symbols.indexOf(symbol) === -1) {
        newSymbols.push(symbol);
      }
    });

    if (prices.length === symbols.length && prices.length > 0 && (this._allIn(symbols) || all)) {
      return prices;
    } else {
      if (newSymbols.length > 0) {
        this._add(newSymbols);
      }


      // if (this.symbols.length !== this.realSymbols.length) {
      //   clearTimeout(this.timerConnect);
      //   this.timerConnect = setTimeout(() => {
      //     this._connect();
      //   }, 50);
      // }
    }
  }

  _allIn(symbols) {
    var all = true;

    this.symbols.forEach((symbol) => {
      if (symbols.indexOf(symbol) === -1) {
        all = false;
      }
    });

    return all;
  }
}
