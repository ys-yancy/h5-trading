"use strict";
require('./index.css');
var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var Config = require('../../app/config');
var Hammer = require('../../lib/hammer');
var Dialog = require('../dialog/index');
var tmpl = require('./index.ejs');
var dialogTmpl = require('./dialod.ejs');

function BottomAccount() {
  BottomAccount.superclass.constructor.apply(this, arguments);
  this.init();
}

Base.extend(BottomAccount, PageBase, {
  init: function() {
    this._initAttrs();
    this._bind();
    this._getAccount();

    setTimeout(() => {
      this.interval();
    }, 3000);

    this.getAccountData({ interval: true });

  },

  _bind: function() {
    var doc = $(document);
    var self = this;

    // doc.on('click', '.J_Switch', $.proxy(this._switch, this));
    //this.subscribe('reject:realToken', this._reject, this);
    this.subscribe('get:accountData', this._getAccountData, this);
    this.subscribe('get:orderHistoryDetail', this._getOrderHistoryDetail, this);
    this.subscribe('update:account', this.getAccountData, this);

    this.on('get:done', () => {
      setTimeout(() => {
        this.getAccountData({ fresh: true, interval: true });
      }, 30 * 1000);
    });



    // doc.on('click', '.account-bottom-banner', (e) => {
    //   if (self.isTwincle) {
    //     this.dialog();
    //   }
    // })
  },

  // interval: function() {
  //   this.inerval = setTimeout(() => {
  //     try {
  //       this.autoFresh = true;
  //       this._getAccount().then(() => {
  //         this.interval();
  //       });
  //     } catch (e) {
  //       this.interval();
  //     }
  //   }, Config.getInterval());
  // },

  destroy: function() {
    var doc = $(document);

    doc.off('click', '.J_Switch', $.proxy(this._switch, this));
    //this.subscribe('reject:realToken', this._reject, this);
    this.unsubscribe('get:accountData', this._getAccountData, this);
    this.unsubscribe('get:orderHistoryDetail', this._getOrderHistoryDetail, this);

    clearTimeout(this.inerval);
    this.cookie.expire('goType');

    this.cookie.set('type', getSimulatePlate() ? 'demo' : 'real', {
      expires: Infinity
    });
  },

  getAccountData: function(e) {
    this._getAccount(e);
  },

  _lazyBind: function() {

  },

  _switch: function(e) {

  },

  _reject: function() {
    this.fire('toggle:account:error');
  },

  _switchReset: function() {
    this.switchEl.removeClass('firm-s');
    this.descEl.text('模拟').show();
    this.parent.removeClass('unfold');
  },

  _switchReal: function() {
    var desc = '实盘';

    this.cookie.set('type', 'real', {
      expires: Infinity
    });

    this.switchEl.addClass('firm-s');
    this.descEl.text(desc).show();
    this.parent.removeClass('unfold');
    this.curEl.addClass('active');
    this.curEl.siblings('.J_Switch').removeClass('active');
  },

  interval: function() {
    this.inerval = setTimeout(() => {
      try {
        this.autoFresh = true;
        this._getAccount().then(() => {
          this.interval();
        });
      } catch (e) {
        this.interval();
      }
    }, Config.getInterval());
  },

  _getAccount: function(e) {
    var self = this,
      type = self.isDemo() ? 'demo' : 'real',
      typeTag = 'init-' + type;

    if (e && e.fresh) {
      this.autoFresh = true;
    }

    if (this[typeTag] && !this.autoFresh) {
      this._toggleAccount();
      return;
    }

    // return this.getAccount().then(function(data) {
    //     self.account = data.account;
    //     return self.getCurrentOrderList();
    // }).then(function(data) {
    return this._getAccountFromCache(e && e.fresh).then((data) => {
      self.orderList = data;
      self[type + 'OrderList'] = data;
      self.broadcast('get:orderList', data);

      if (this.filterUI) {
        data.symbols = [];

        data.list = data.list.filter((order) => {
          if (this.props && this.props.currentOrderList.indexOf(order.ticket) !== -1) {
            data.symbols.push(order.symbol);
            return true;
          }
        });

      }

      // this._check(data);
      self.getFloatingProfit(self.account, data.list, data.symbols).done((profit, floatOption) => {
        var netDeposit = parseFloat(self.account[type].balance) + parseFloat(profit);

        var freeMargin = netDeposit - parseFloat(data.margin);
        var rate = data.margin === 0 ? '--' : ((netDeposit / parseFloat(data.margin)) * 100).toFixed(2);
        var rate = rate === '--' ? '--' : parseFloat(rate);
        var detail = this._getDetail();

        this._setBalance(self.account);

        if (data.margin && type === 'real') {
          var originRate = netDeposit / parseFloat(data.margin);
          // originRate = 1.04
          if (originRate < 1) {
            this.broadcast('check:closed');
            self.isTwincle = false;
            this.hideTwincle();
          } else if (originRate < 1.1 && this.checkOut) {
            this.showWarn();
            self.isTwincle = true;
          } else if (originRate < 1.3 && this.checkOut) {
            this.showTwincle();
            self.isTwincle = true;
          } else {
            this.hideTwincle();
            self.isTwincle = false;
          }
        }

        var val = 0;
        for (var i = 0, len = data.list.length; i < len; i++) {
          var order = data.list[i];
          
          // 用 min_quote_unit 算
          var pipValue = 1;
          if (order.symbol.indexOf('XAGUSD') != -1) {
            pipValue = 5;
          }
          else if (order.symbol.indexOf('XTIUSD') != -1) {
            pipValue = 10;
          }
          // 需要计算投入金额
          val += Math.abs(order.takeProfit - order.openPrice) / order.min_quote_unit * order.volume * pipValue; // * Config.getConmissionRate();

        }

        var tmplData = {
          netDeposit: netDeposit,
          freeMargin: freeMargin,
          profit: profit,
          rate: rate,
          type: type,
          edit: self.edit,
          init: self.hasInit,
          balance: this._getBalance(),
          page: this.page,
          listLen: data.list.length,
          list: data.list,
          floatOption: floatOption
        };

        // 极速 UI 的可用资金 = 账户余额 / 2 - 投入资金
        tmplData.nextNetDeposit = parseFloat(self.account[type].balance) / 2 - val;

        tmplData = $.merge(tmplData, detail);

        this.broadcast('account:did:update', tmplData);


        self[typeTag] = true;

        self._toggleAccount();
        self.fire('get:realFloatMargin', floatOption);

        e && e.interval && this.fire('get:done');
      });
    }, function(a) {
      if (location.href.indexOf('/option.html') !== -1) {
        return;
      }
      if (!self.isDemo()) {
        self.cookie.set('type', getSimulatePlate() ? 'demo' : 'real');
        self._getAccount();
      }
    });
  },

  renderX: function(el, val) {
    var intEl = $('.int', el);
    var floatEl = $('.small', el);
    var minus = false;

    if (val === '--' || val === undefined) {
      intEl.text('--');
      // floatEl.text('--');
      return;
    }

    if (val < 0 && parseInt(val) == 0) {
      minus = true;
    }

    // 尝试解决 1.99999 和 -1.99999 的问题
    var num;
    if (val.toString().indexOf('.999') != -1) {
      if (val > 0) {
        num = parseInt(val + 1) + '.';
      } else {
        num = parseInt(val - 1) + '.';
      }
    } else {
      num = parseInt(val) + '.';
    }

    num = minus ? '-' + num : num;

    intEl.text(num);

    floatEl.text(Math.abs(parseFloat(val) - parseInt(val)).toFixed(2).slice(2));
  },

  update: function(data) {
    this.renderX(this.floatProfitEl, data.profit);
    this.renderX(this.freeMarginEl, data.freeMargin);
    this.renderX(this.rateEl, data.rate);
    this.renderX(this.netDepositEl, data.netDeposit);
    this.renderX(this.balanceEl, data.balance);
    this.renderX(this.totalProfitsEl, data.total);
  },

  _getAccountFromCache: function(fresh) {
    var d = new $.Deferred(),
      type = this.isDemo() ? 'demo' : 'real';

    if (!fresh && this.cacheOrderList[type]) {
      d.resolve(this.cacheOrderList[type]);
    } else {
      this.getAccount().then((data) => {
        this.account = data.account;
        return this.getCurrentOrderList();
      }).then((data) => {
        var type = this.isDemo() ? 'demo' : 'real';
        this.cacheOrderList[type] = data;
        d.resolve(data);
      });
    }

    return new d.promise();
  },

  _setBalance: function(account) {
    // 20160910 不显示模拟
    if ( getSimulatePlate() ) {
      this.demoBalance = parseFloat(account.demo.balance);
    }
    this.realBalance = parseFloat(account.real.balance);
  },

  _getBalance: function() {
    var type = this.isDemo() ? 'demo' : 'real';

    return this[type + 'Balance'];
  },

  _getOrderHistoryDetail: function(data) {
    $('.J_TotalTrade').text(data.totalTrade);
    var type = this.isDemo() ? 'demo' : 'real';

    this[type + 'totalTrade'] = data.totalTrade;
    this[type + 'total'] = data.total
  },

  _getDetail: function() {
    var type = this.isDemo() ? 'demo' : 'real';

    return {
      totalTrade: this[type + 'totalTrade'],
      total: this[type + 'total']
    }
  },

  _getAccountData: function(data) {
    data.init = true;

    var detail = this._getDetail();

    data = $.merge(data, detail);
    data.page = this.page;
    data.balance = this._getBalance();
    // console.log(data);

    this.update(data);

    // var html = this.render(tmpl, data);
    // if (data.type === 'demo') {
    //     $('#J_DemoAccount').replaceWith($(html));
    // } else {
    //     $('#J_Account').replaceWith($(html))
    // }
  },

  _toggleAccount: function() {
    // var isDemo = this.isDemo();
    // isDemo ? this.el.removeClass('real') : this.el.addClass('real');

    // this.orderList = isDemo ? this.demoOrderList : this.realOrderList;
    // this.fire('toggle:account', {
    //   demo: isDemo
    // });
  },

  showTwincle: function() {
    // this.el.addClass('twinkle').removeClass('twinkle-warn');
  },

  showWarn: function() {
    // this.el.addClass('twinkle-warn').removeClass('twinkle');
  },

  hideTwincle: function() {
    // this.el.removeClass('twinkle-warn').removeClass('twinkle');
  },

  dialog: function() {
    // this.warnDialog = new Dialog({
    //   isShow: true,
    //   confirmAndClose: true,
    //   tmpl: this.render(dialogTmpl, {}),
    //   // confirmCallback: $.proxy(this._removeFav, this)
    // });
  },

  _initAttrs: function() {
    // this.el = $('#J_BottomBanner');
    this.prices = {};
    this.cacheOrderList = {};
  },

  show: function() {
    // this.el.show();
  }
});

module.exports = BottomAccount;
