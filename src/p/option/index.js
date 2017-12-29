var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var Config = require('../../app/config');
var Util = require('../../app/util');
var Uri = require('../../app/uri');
var Symbol = require('../../app/symbol');
var storage = require('../../app/storage');
var Cookie = require('../../lib/cookie');
var Sticky = require('../../common/sticky');
var Dialog = require('../../common/dialog');
var Stomp = require('../../common/stomp');
var CustomerService = require('../../common/customer-service');
var BottomAccount = require('../../common/bottom-account');
var OptionSymbol = require('../../common/option-symbol');
var Check = require('../../common/check');
var SildeMenu = require('../../common/slide-menu');
const Sound = require('../../common/sound');

var tmpl = require('./index.ejs');

// require('./component/guide');

function Option() {
  Option.superclass.constructor.apply(this, arguments);

  var self = this;

  var params = new Uri().getParams();
  // 记录用户来源, 优先取微信的from, 其次是我们自己定的source
  this.source = params.from ? params.from : params.source;
  if (!Cookie.get('source') && this.source) {
    Cookie.set('source', this.source);
  }


  // 没有用户就跳转到登录页面
  if (Cookie.get('token')) {
    this.getAllSymbolsPrice().then(() => {
      self.init();
    });
  } else {
    window.location = getLoginWL();
  }

  // 提交版本号
  if (Cookie.get('h5_version') != Config.getVersion() && !Config.isAndroidAPK()) {
    this.ajax({
      url: '/v1/report/user-agent/version/',
      data: {
        access_token: Cookie.get('token'),
        app: 'H5',
        version: Config.getVersion()
      },
      type: 'post'
    }).then((data) => {
      console.log(data);
      Cookie.set('h5_version', Config.getVersion());
    });
  }

}

Base.extend(Option, PageBase, {
  init: function() {
    this._getData();
    this._bind();
    this._requires();
    this._initSticky();
    
    this._initAttrs();
    this._configShare();
    this.configStatistics();
    // new LiveSpeech();
    new Check();
    new Sound();
  },

  _bind: function() {
    var doc = $(document);
    // doc.on('click', '.J_Percent', $.proxy(this._switchView, this));
    doc.on('swipeLeft swipeRight', '.link', $.proxy(this._swipeLeft, this));
    doc.on('touchstart', '.link', $.proxy(this._touchLink, this));
    doc.on('click', '.J_UpSymbol', $.proxy(this._upSymbol, this));
    doc.on('click', '.J_DelSymbol', $.proxy(this._delSymbol, this));

    doc.on('tap', '.J_OpenSearch', $.proxy(function(e) {
      this.headerEl.addClass('unfold');
    }, this));

    doc.on('tap', '.J_CloseSearch', $.proxy(function(e) {
      this.headerEl.removeClass('unfold');
    }, this));

    doc.on('click', '.J_ExtraItem', (e) => {
      var curEl = $(e.currentTarget);

      if (curEl.hasClass('add')) {

        this._tips(e);
      }

    });


    this.subscribe('switch:account', function() {
      setTimeout(function() {
        location.reload();
      }, 0);
    });

    this.subscribe('reject:realToken', this._reject, this);

    this.subscribe('get:realToken', this._getRealToken, this);

    doc.on('click', '.J_GoShare', (e) => {
      var curEl = $(e.currentTarget);
      var href = curEl.attr('href');
      curEl.attr('href', href + '?src=' + decodeURIComponent(location.href));
    })
  },

  _delSymbol: function(e) {
    var curEl = $(e.currentTarget),
      symbol = curEl.attr('data-symbol');

    e.stopPropagation();
    e.preventDefault();

    OptionSymbol.remove(symbol).then(() => {
      curEl.parents('.item').remove();
      var symbols = this._getCookieSymbols();
      var index = symbols.indexOf(symbol);

      if (index !== -1) {
        symbols.splice(index, 1);
        this._setCookieSymbols(symbols);
      }
    });
  },

  _upSymbol: function(e) {
    var curEl = $(e.currentTarget),
      symbol = curEl.attr('data-symbol');

    e.stopPropagation();
    e.preventDefault();

    var symbols = this._getCookieSymbols();
    var index = symbols.indexOf(symbol);

    if (index === -1) {
      symbols = [symbol].concat(symbols);
    } else {
      var tmp = symbols[index];
      symbols[index] = symbols[0];
      symbols[0] = tmp;
    }

    // this.ajax({
    //   url: '/v1/user/fav/symbol/',
    //   data: {
    //     access_token: this.cookie.get('token'),
    //     symbol: symbol,
    //     action: 'up'
    //   },
    //   type: 'put'
    // }).then((data) => {
    //   console.log(data);
    // });

    this._setCookieSymbols(symbols);


    var itemEl = curEl.parents('.item');
    var itemFristEl = $($('.item')[0]);
    itemEl.insertBefore(itemFristEl);
    $('.link', itemEl).trigger('swipeRight');
  },

  _getCookieSymbols: function() {
    var type = this.isDemo() ? 'demo' : 'real';
    var name = type + 'symboyup';
    var symbols = JSON.parse(Cookie.get(name) || '[]');

    return symbols;
  },

  _setCookieSymbols: function(symbols) {
    var type = this.isDemo() ? 'demo' : 'real';
    var name = type + 'symboyup';

    Cookie.set(name, JSON.stringify(symbols));
  },

  _swipeLeft: function(e) {
    var curEl = $(e.currentTarget);
    
    if (e.type === 'swipeLeft') {
      curEl.addClass('unfold');
      this.swipeTouch = true;
    } else {
      curEl.removeClass('unfold');
      this.swipeTouch = false;
    }
  },

  _touchLink: function(e) {
    var curEl = $(e.currentTarget);

    if (this.swipeTouch) {
      if (!curEl.hasClass('unfold')) {
        $('.link').removeClass('unfold');
      }
    }

  },


  _reject: function(data) {
    if (this.isDemo()) {
      this.slideMenu && this.slideMenu.resetBottomAccount();
      return;
    } else {
      this.cookie.set('type', 'demo');
      location.reload();
    }
  },

  _switchView: function(e) {
    var curEl = $(e.currentTarget);
    var dataVal = curEl.attr('data-range');
    var val = curEl.text();
    e.preventDefault();
    e.stopPropagation();

    if (curEl.hasClass('range')) {

      curEl.addClass('range');

    } else {
      curEl.removeClass('range');
    }

    curEl.text(dataVal);
    curEl.attr('data-range', val);
  },

  _configShare: function() {
    if (this.isWeixin()) {
      var self = this;
      this.getAccount().then(function(account) {
        if (!self.profileObject) {
          self.profileObject = new Object();
        }
        self.profileObject.avatar = account.avatar ? Config.getAvatarPrefix(account.avatar) : '';
        self.profileObject.nickname = account.nickname;
        self.setupWeiXinShare('invite');
      });
    }
  },

  _lazyBind: function() {
    this.subscribe('stomp:price:update', (data) => {
      var oldSymbol = this.cacheSymbol[data.symbol];
      oldSymbol && this._updatePrice(data);
    });
  },

  _updatePrice: function(data) {
    var oldSymbol = this.cacheSymbol[data.symbol];
    var minUnit = oldSymbol.minUnit.toString();

    try {
      var itemEl = $('.item[data-symbol=' + data.symbol + ']');
    } catch (e) {
      var itemEl = $('.item[data-symbolname=' + data.symbol.replace(/\./g, '--') + ']');
    }

    var percentEl = $('.percent', itemEl);
    minUnit = minUnit.split('.')[1].split('').length;

    // var symbol = self._getSymbol(item.symbol);
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

    if (bidPrice) {
      bidPrice = parseFloat(bidPrice).toFixed(minUnit);
      $('.J_BidPrice', itemEl).text(bidPrice);
      oldSymbol.bidPrice = bidPrice;
    }

    // if (askPrice && bidPrice) {
    //   var spread = Math.abs(askPrice - bidPrice);
    //   spread = spread.toFixed(minUnit);
    //   $('.J_Spread', itemEl).text(spread);
    //   oldSymbol.spread = spread;
    // }
    //});
  },

  _getData: function() {
    var self = this,
      token = Cookie.get('token');

    if (!token) {
      this.listEl.html('<li class="empty">您还没有添加自选品种</li>');
    }

    var data = { access_token: token }

    var type = this.isDemo() ? 'demo' : 'real';

    if (!Cookie.get('tradingUI')) {
      Cookie.set('tradingUI', getDefaultTradingUI());
    }

    if (Cookie.get('tradingUI') == 6) {
      data.symbols = this.rapid;

      Symbol.get(this.rapid).then((data) => {
        self._parse(data);

        data = this._sortUp(data);
        self.symbolsList = data;
      
        // 使用r文件配置交易UI的方案
        // data.tradeUI = getTradeUI();

        // 用户自己切换的方案
        var tu = Cookie.get('tradingUI') || getDefaultTradingUI();
        if (tu == 4) {
          data.tradeUI = './pro-trading.html?';
        } else {
          data.tradeUI = './rapid.html?deal=investnow&';
        }


        self.render(tmpl, data, self.listEl);
        self._saveOptionData(data);

        if (Util.supportWebsocket()) {
          // this.stomp = new Stomp({
          //    symbols: this.symbols
          // });
        } else {
          self._setInterval();
        }

        this._lazyBind();
      });

      return;
    }

    this.ajax({
      url: '/v3/' + type + '/symbols6/',
      data: data
    }).then((data) => {
      data = data.data;

      Symbol.save(data);

      // self.symbols[N] 存储收藏品种symbol
      self._parse(data);

      data = this._sortUp(data);
      self.symbolsList = data;

      // 使用r文件配置交易UI的方案
      // data.tradeUI = getTradeUI();

      // 用户自己切换的方案
      var tu = Cookie.get('tradingUI') || getDefaultTradingUI();
      if (tu == 4) {
        data.tradeUI = './pro-trading.html?';
      } else {
        data.tradeUI = './rapid.html?deal=investnow&';
      }

      self.render(tmpl, data, self.listEl);
      self._saveOptionData(data);


      if (Util.supportWebsocket()) {} else {
        self._setInterval();
      }

      this._lazyBind();
    });
  },

  _sortUp: function(data) {
    var type = this.isDemo() ? 'demo' : 'real';
    var symbols = this._getCookieSymbols();
    var arr = [];

    for (var i = 0, len = symbols.length; i < len; i++) {
      var quote = get(symbols[i], data);
      if (quote) {
        arr.push(quote);
      }
    }

    return arr.concat(data);


    function get(symbol, data) {
      for (var i = 0, len = data.length; i < len; i++) {
        if (data[i].policy.symbol === symbol) {
          var tmp = data[i];
          data.splice(i, 1);

          return tmp;
        }
      }
    }
  },

  _setInterval: function() {
    var self = this;
    var symbolsStr = this._getSymbolStr();

    var type = this.isDemo() ? 'demo' : 'real';

    this.ajax({
      url: this.priceUrl,
      data: {
        symbol: symbolsStr
      },
      unjoin: true
    }).then(function(data) {
      data = data.data;

      $.each(data, function(index, item) {
        var oldSymbol = self.cacheSymbol[item.symbol];
        var minUnit = oldSymbol.minUnit;

        try {
          var itemEl = $('.item[data-symbol=' + item.symbol + ']');
        } catch (e) {
          var itemEl = $('.item[data-symbolname=' + item.symbol.replace(/\./g, '--') + ']');
        }

        var percentEl = $('.percent', itemEl);
        minUnit = minUnit.split('.')[1].split('').length;

        // var symbol = self._getSymbol(item.symbol);
        var askPrice = item.ask_price[0];
        var bidPrice = item.bid_price[0];

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

        if (bidPrice) {
          bidPrice = parseFloat(bidPrice).toFixed(minUnit);
          $('.J_BidPrice', itemEl).text(bidPrice);
          oldSymbol.bidPrice = bidPrice;
        }

        // if (askPrice && bidPrice) {
        //   var spread = Math.abs(askPrice - bidPrice);
        //   spread = spread.toFixed(minUnit);
        //   $('.J_Spread', itemEl).text(spread);
        //   oldSymbol.spread = spread;
        // }
      });

      setTimeout(function() {
        self._setInterval();
      }, self.getIntervalTime());
    });
  },

  _getSymbolStr: function() {
    var type = this.isDemo() ? 'demo' : 'real',
      symbols = [];

    for (var i = 0, len = this.symbolsList.length; i < len; i++) {
      var policy = this.symbolsList[i].policy;
      var str = 'quote.' + type + '_default.' + policy.symbol;

      symbols.push(str);
    }

    return symbols.join(',');
  },

 
  _getSymbol: function(symbol) {
    var symbolsList = this.symbolsList;

    for (var i = 0, len = symbolsList.length; i < len; i++) {
      if (symbolsList[i].policy.symbol === symbol) {
        return symbolsList[i];
      }
    }
  },

  _parse: function(data) {
    //status 默认是余额不足， break表示违规，simulate表示限模拟，close表示休市
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
          minUnit: item.policy.min_quote_unit,
          askPrice: item.quote.ask_price[0],
          bidPrice: item.quote.bid_price[0],
          closePrice: item.close_price
        };

        this.symbols.push(item.policy.symbol);
      }
    });

    // 处理列表中的直播品种
    this.subscribe('get:streamlist', (e) => {

      $.each(e.symbolsList, (index, item) => {
        for (var i = 0; i < e.streamlist.length; i++) {

          if (e.streamlist[i].tag.split(',').indexOf(item.policy.symbol) != -1) {

            // 当前时间在start_time和end_time之间才是 直播中
            if (Date.now() >= Date.parse(e.streamlist[i].start_time.replace(/-/g, '/')) && Date.now() <= Date.parse(e.streamlist[i].end_time.replace(/-/g, '/'))) {
              item.tag = '直播中';
              item.className = 'simulate';
              var itemEl;
              try {
                itemEl = $('.status[data-symbol=' + item.policy.symbol + ']');
              } catch (e) {
                itemEl = $('.status[data-symbolname=' + item.policy.symbol.replace(/\./g, '--') + ']');
              }
              itemEl[0].innerHTML = '直播中';
              itemEl[0].style.visibility = 'visible';
              itemEl[0].className = 'status livespeech';

              break;
            }
          }
        }
      });

    });

    this.cacheSymbol = cacheSymbol;

    // 计算余额不足
    if (symbols.length < 0) {
      return;
    }
    this.getAccount().then(function(account) {
      var _self_op = self;
      self.broadcast('get:myaccount', account);

      // 获取当前有效的所有直播列表
      // /v1/stream/list/?access_token=token4018&tag=EURUSD
      self.ajax({
        url: '/v1/stream/list/',
        data: {
          access_token: Cookie.get('token'),
          tag: account.wl
        }
      }).then(function(data) {
        _self_op.streamlist = data.data;
        // 直播功能
        // _self_op.broadcast('get:streamlist', _self_op);
      });

      // 如果没有weixin.openID且在微信里, 就获取openID
      var hasWeixin = false;
      if (account.sns && account.sns.length != 0) {
        for (var i = 0; i < account.sns.length; i++) {
          // 判断有weixin且openid不为空, 格式 weixin|o8gZ_uNYtqfV55vUs6GSOSnOiQT8
          if (account.sns[i].indexOf('wechat') != -1 && account.sns[i].length > 7) {
            hasWeixin = true;

            // 在本地记录weixin的openid, 稍后备用
            self.weixin_openid = account.sns[i].substr(7, account.sns[i].length - 7);
            break;
          }
        }
      }

      // 添加获取微信openID 或者 显示授权获取头像&昵称
      if (self.isWeixin() && getUserInfoWX() && !hasWeixin) {

        var last = self.weixinUrlLast;
        // 显示授权获取头像&昵称&openID (前提是该白标的 r 文件中开启了getUserInfoWX)
        if (account.avatar.indexOf('http') == -1 && getUserInfoWX() ) {
          last = self.weixinUserInfoUrlLast;
        }

        var as = $('#J_List a'),
          at = Cookie.get('token'),
          h;
        for (var i = 0; i < as.length; i++) {
          h = '?token=' + at+ '&wl='+ Cookie.get('wl') + '&ri=' + encodeURIComponent(as[i].href);
          h = self.weixinUrlFirst + encodeURIComponent(h) + last;
          console.log(h)
          as[i].href = h;
        }
      }
      $.each(symbols, function(index, item) {
        self.checkStatus(item, account.account).then(function(status) {
          if (status.tag) {
            var itemEl;
            try {
              itemEl = $('.status[data-symbol=' + item.policy.symbol + ']');

            } catch (e) {
              itemEl = $('.status[data-symbolname=' + item.policy.symbol.replace(/\./g, '--') + ']');
            }
            itemEl.css('visibility', 'visible');
          }
        });
      });
    })
  },

  _tips: function(e) {
    var ui = Cookie.get('tradingUI');

    if (ui == 4) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    var dialog = new Dialog({
      isShow: true,
      tmpl: `<div class=" dialog-standard" id="J_Dialog">
               <span class="wrapper-icon"><span class="icon"></span></span>
               <div class="dialog-content J_Content">
                   <p class="title"> 您正在使用极速交易模式，须使用限定品种下单。如需更改品种，请切换至专业交易模式</p>
               </div>
               <div class="dialog-buttons clearfix">
                   <span class="dialog-btn   J_DialogConfirm" id="">切换至专业交易</span>
                   <span class="dialog-btn J_DialogClose ">继续使用</span>
                   <span class="bar"></span>
               </div>
            </div>
            <div class="dialog-mask J_DialogMask"></div>`,
      confirmCallback: function() {
        Cookie.set('tradingUI', 4);
        
        location.reload();
      }
    });
  },

  _saveOptionData: function(data) {
    var optionList = [],
      key = this.isDemo() ? 'demoOptionList' : 'optionList',
      token = Cookie.get('token'),
      key = token + key;

    $.each(data, function(index, item) {
      var symbol = item.policy.symbol;
      optionList.push(symbol);
    });

    storage.set(key, optionList);
  },

  _getRealToken: function() {
    var isShowSildeMenu = $('body').hasClass('show-slide-menu');

    if (isShowSildeMenu) {} else {
      window.location.reload();
    }
  },

  _requires: function() {
    if (this.cookie.get('phone')) {
      this.slideMenu = new SildeMenu({
        el: $('#J_SlideMenu'),
        page: 'option'
      })
    }
  },

  _initSticky: function() {
    $('nav').sticky();
  },

  _initAttrs: function() {
    var helpEl = $('.help', 'header');
    var link = helpEl.attr('href');

    link += '?src=' + encodeURIComponent(location.href);

    helpEl.attr('href', link);

    // 对于首次使用用户加红点
    var token = this.cookie.get('token');
    if (!storage.get(token)) {
      helpEl.addClass('new');

    }
  },

  _help: function(e) {
    var token = this.cookie.get('token');
    storage.set(token, 'true');
  },

  attrs: {
    headerEl: $('#J_Header'),
    listEl: $('#J_List'),

    rapid: Config.getDefaultRapidSymbols()
  }
});

new Option();
