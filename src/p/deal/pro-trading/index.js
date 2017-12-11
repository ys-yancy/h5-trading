'use strict';


// var PageBase = require('../../../app/page-base');
// var Chart = require('../../../common/chart/intraday');

"use strict";

var Base = require('../../../app/base');
var PageBase = require('../../../app/page-base');
var Dialog = require('../../../common/dialog');
var Toast = require('../../../common/toast');
// var Chart = require('../../../common/chart');
var Chart = require('./chart');
var Progress = require('./progress');

var Uri = require('../../../app/uri');
var Util = require('../../../app/util');
var storage = require('../../../app/storage');
var Config = require('../../../app/config');
// var CandleRefresh = require('../../../common/candle-refresh');
var MarqueeTitle = require('../../../common/marquee-title');

var infoTmpl = require('./tpl/info.ejs');
var symbolInfoTmpl = require('./tpl/symbol-info.ejs');
var orderTmpl = require('./tpl/order.ejs');
var successTmpl = require('./tpl/success.ejs');
var footerTmpl = require('./tpl/footer.ejs');
var accountTmpl = require('./tpl/account.ejs');
var dialogErrorTmpl = require('./tpl/dialog-error.ejs');

var Investment = require('./invest/index');
// new Investment();
var Popup = require('./popup/index');
//new Popup();
window.Popup = Popup

function ProTrading() {
  ProTrading.superclass.constructor.apply(this, arguments);

  if (Util.isWeixin()) {
    // $('#J_NavBack').hide();
  }

  this.getToken().then(() => {
    if (this.cookie.get('goType')) {
      this.cookie.set('type', 'real');
    }
    this.init();
  });
}

Base.extend(ProTrading, PageBase, {
  init: function() {
    this._initAttrs();
    this._bind();
    // this._initChart();

    this._getCurPrice();
    this._getSymbol();

    this.configStatistics();

    // new OptionBanner({
    //     el: $('#J_OptionBanner'),
    //     symbol: this.symbol,
    //     optionAdd: this.optionAdd,
    //     name: this.name
    // });
  },

  mix: [MarqueeTitle],

  _bind: function() {
    var doc = $(document);

    // doc.on('click', '.J_Switch', $.proxy(this._switch, this));
    doc.on('tap', '.J_Trusteeship', $.proxy(this._switchTrust, this));
    doc.on('tap', '.action', $.proxy(this._action, this));
    // doc.on('tap', '.option', $.proxy(this._option, this));
    // doc.on('tap', '.range-selector', $.proxy(this._selectRange, this));

    doc.on('tap', '.J_CancelEdit', $.proxy(this._cancelEdit, this));
    doc.on('tap', '.J_SumitEdit', $.proxy(this._submitEdit, this));

    this.subscribe('reject:realToken', this._rejectRealToken, this);
    this.subscribe('get:realToken', this._getRealToken, this);

    this.subscribe('action:option', this._actionOption, this);
    this.subscribe('action:hideLoad', this._hideLoad, this);

    this.subscribe('invest:now', this._invest, this);

    // 添加默认微信分享
        if (this.isWeixin()) {
          this.setupWeiXinShare('default_invite');
        }
  },

  _lazyBind: function() {
    $('#J_OpenPriceInput').on('blur', $.proxy(this._priceValidate, this));
    $('#J_Volumn').on('blur', $.proxy(this._volumeValidate, this));
    $('#J_Profit').on('blur', $.proxy(this._profitValidate, this));
    $('#J_Loss').on('blur', $.proxy(this._lossValidate, this));
  },

  _lazyBindAccount: function() {
    var self = this;
    $('#J_GetSwitch').on('click', function(e) {
      var parent = $(this).parent('.switch-wrapper'),
        descEl = $('.desc', parent);

      // 编辑模式下不可编辑
      if (self.edit) {
        return;
      }

      if (!parent.hasClass('unfold')) {
        descEl.hide();
      } else {
        descEl.show();
      }
      parent.toggleClass('unfold');
    });
  },

  _submitEdit: function(e) {
    e.preventDefault();
    var curEl = $(e.currentTarget),
      up = this.cmd.indexOf('buy') !== -1;

    if (!this._validate(up)) {
      return;
    }

    // 修改订单
    var params = this._getParams(up, self.cmd);

    this._ModifyOrder(params, up, curEl);

  },

  _cancelEdit: function(e) {
    $('#J_NavBack').trigger('click');
  },

  _priceValidate: function(e, submit, up) {
    var curEl = $(e.currentTarget),
      cmd = e.cmd;

    if (this.open) {

      var val = curEl.val();
      var price = this.price,
        minOpenPriceGap = parseFloat(this.symbolValue.policy.min_open_price_gap),
        pip = parseFloat(this.symbolValue.policy.pip),
        message = '最小差' + minOpenPriceGap + '点';

      if (!val) {
        this._showError(curEl, '开仓价格不能为空');
        return;
      }

      if (!/^\d+(\.\d+)?$/.test(val)) {
        this._showError(curEl, '开仓价格必须为数字');
        return;
      }

      val = parseFloat(val);

      if (isNaN(val)) {
        this._showError(curEl, '开仓价格必须为数字');
        return;
      }

      if ((Math.abs(price - val) < minOpenPriceGap * pip) && !this.open) {
        this._showError(curEl, message);

        return;
      }
    }

    // 计算浮动盈亏
    if (!submit) {
      if (!this.symbolValue) {
        return;
      }
      this._getFloatMoney();
      // 这里要使用openPrice来计算保证金, 而不是this.price
      if (this.openPrice == '--') {
        return;
      }
      this.getMargin(this.openPrice, this.symbolValue, parseFloat($('#J_Volumn').val() || 0), this.account).then(function(margin) {
        var fixed = 2;

        margin = margin.toFixed(fixed),
          curEl.siblings('p').text('占用资金（$）' + margin);
      }).fail(function() {});

    }

    curEl && this._hideError(curEl);
    return true;
  },

  _volumeValidate: function(e, submit, up) {
    var curEl = $(e.currentTarget);
    var val = curEl.val(),
      minVolume = this.symbolValue.policy.min_vol,
      maxVolume = this.maxVolume,
      message;

    if (!val) {
      this._showError(curEl, '交易量不能为空');
      return;
    }

    if (!/^\d+(\.\d+)?$/.test(val)) {
      this._showError(curEl, '交易量必须为数字');
      return;
    }

    val = parseFloat(val);

    // if (val > minVolume && val < maxVolume) {
    //     this._hideError(curEl);
    //     return ;
    // }
    if (val < minVolume) {
      message = '最小交易量' + minVolume;
      this._showError(curEl, message);
      return;
    } else if (val > maxVolume) {
      message = '超过最大可买';
      this._showError(curEl, message);
      return;
    }

    // 计算浮动盈亏
    if (!submit) {
      if (!this.symbolValue) {
        return;
      }
      this.volume = parseFloat(val);
      this._getFloatMoney();

      // 计算占用保证金

      this._getFloatMoney();
      // 这里要使用openPrice来计算保证金, 而不是this.price
      if (this.openPrice == '--') {
        return;
      }
      this.getMargin(this.openPrice, this.symbolValue, parseFloat($('#J_Volumn').val() || 0), this.account).then(function(margin) {
        var fixed = 2;
        margin = margin.toFixed(fixed);
        $('#J_OpenPriceInput').siblings('p').text('占用资金（$）' + margin);
      }).fail(function() {});
    }

    this._hideError(curEl);

    return true;
  },

  _profitValidate: function(e, submit, up) {
    var curEl = $(e.currentTarget),
      cmd = e.cmd;

    var val = curEl.val(),
      minOpenPriceGap = this.symbolValue.policy.min_open_price_gap,
      pip = this.symbolValue.policy.pip,
      message,
      errMsg,
      price = $('#J_OpenPriceInput').val();

    // 如果是open订单, 那么判断标准是 当前价格, 而不是 开仓价格
    if (this.edit && this.orderObject && this.orderObject.status === 'open') {
      if (up) {
        price = this.bidPrice;
      } else {
        price = this.askPrice;
      }
    }

    // if (!val && up) {
    //     this._showError(curEl, '目标价格不能为空');
    //     return;
    // }

    if (!val) {
      this._hideError(curEl);
      this.takeProfit = 0;
      return true;
    }


    if (!/^\d+(\.\d+)?$/.test(val)) {
      this._showError(curEl, '止盈价格必须为数字');
      return;
    }

    val = parseFloat(val);

    if (Math.abs(price - val) < minOpenPriceGap * pip) {
      this._showError(curEl, '最小价差小于' + minOpenPriceGap);
      return;
    }

    if (submit) {
      if (up) {
        if (val < price) {
          errMsg = '应高于' + (this.edit && this.orderObject && this.orderObject.status === 'open' ? '当前' : '开仓') + '价格';
          this._showError(curEl, errMsg);
          return;
        }
      }

      if (!up) {
        if (val > price) {
          errMsg = '应低于' + (this.edit && this.orderObject && this.orderObject.status === 'open' ? '当前' : '开仓') + '价格';
          this._showError(curEl, errMsg);
          return;
        }
      }
    }

    // 计算浮动盈亏
    if (!submit) {
      // 需要先验证错误
      cmd = cmd || this.cmd;
      if (cmd && cmd.indexOf('buy') != -1) {
        if (val < price) {
          errMsg = '应高于' + (this.edit && this.orderObject && this.orderObject.status === 'open' ? '当前' : '开仓') + '价格';
          this._showError(curEl, errMsg);
          return;
        }
      }

      if (cmd && cmd.indexOf('sell') != -1) {
        if (val > price) {
          errMsg = '应低于' + (this.edit && this.orderObject && this.orderObject.status === 'open' ? '当前' : '开仓') + '价格';
          this._showError(curEl, errMsg);
          return;
        }
      }

      this.takeProfit = parseFloat(val);
      if (!this.symbolValue) {
        return;
      }
      this._getFloatMoney();
    }


    this._hideError(curEl);

    return true;

  },

  _lossValidate: function(e, submit, up) {
    var curEl = $(e.currentTarget),
      cmd = e.cmd;
    var val = curEl.val(),
      minOpenPriceGap = this.symbolValue.policy.min_open_price_gap,
      pip = this.symbolValue.policy.pip,
      message,
      errMsg,
      price = $('#J_OpenPriceInput').val();


    // 如果是open订单, 那么判断标准是 当前价格, 而不是 开仓价格
    if (this.edit && this.orderObject && this.orderObject.status === 'open') {
      if (up) {
        price = this.bidPrice;
      } else {
        price = this.askPrice;
      }
    }

    // if (!val && !up && submit) {
    //     this._showError(curEl, '止损价格不能为空');

    //     return;
    // }

    if (!val) {
      this._hideError(curEl);
      this.stopLoss = 0;
      return true;
    }

    if (!/^\d+(\.\d+)?$/.test(val)) {
      this._showError(curEl, '止损价格必须为数字');
      return;
    }

    val = parseFloat(val);

    if (Math.abs(price - val) < minOpenPriceGap * pip) {
      this._showError(curEl, '最小价差小于' + minOpenPriceGap);
      return;
    }
    if (submit) {
      if (up) {
        if (val > price) {
          errMsg = '应低于' + (this.edit && this.orderObject && this.orderObject.status === 'open' ? '当前' : '开仓') + '价格';
          this._showError(curEl, errMsg);
          return;
        }
      }

      if (!up) {
        if (val < price) {
          errMsg = '应高于' + (this.edit && this.orderObject && this.orderObject.status === 'open' ? '当前' : '开仓') + '价格';
          this._showError(curEl, errMsg);
          return;
        }
      }
    }

    // 计算浮动盈亏
    if (!submit) {

      cmd = cmd || this.cmd;
      // 需要先验证错误
      if (cmd && cmd.indexOf('buy') != -1) {
        if (val > price) {
          errMsg = '应低于' + (this.edit && this.orderObject && this.orderObject.status === 'open' ? '当前' : '开仓') + '价格';
          this._showError(curEl, errMsg);
          return;
        }
      }


      if (cmd && cmd.indexOf('sell') != -1) {
        if (val < price) {
          errMsg = '应高于' + (this.edit && this.orderObject && this.orderObject.status === 'open' ? '当前' : '开仓') + '价格';
          this._showError(curEl, errMsg);
          return;
        }
      }

      this.stopLoss = parseFloat(val);
      if (!this.symbolValue) {
        return;
      }
      this._getFloatMoney();
    }

    this._hideError(curEl);

    return true;
  },

  _showError: function(curEl, message) {
    var parent = curEl.parent('.wrapper');
    var messageEl = curEl.siblings('.err');

    if (messageEl.length === 0) {
      curEl.after('<p class="err">' + message + '</p>');
    } else {
      messageEl.text(message);
      messageEl.show();
    }
    parent.addClass('error');
  },

  _hideError: function(curEl) {
    var parent = curEl.parent('.wrapper');
    var messageEl = curEl.siblings('.err');

    parent.removeClass('error');
    messageEl.hide();
  },

  _switch: function(e) {
    var self = this,
      curEl = $(e.currentTarget),
      parent = curEl.parent('.switch-wrapper'),
      descEl = $('.desc', parent),
      switchEl = $('.switch', parent),
      desc = '模拟';

    e.preventDefault();

    this.parent = parent;
    this.descEl = descEl;
    this.switchEl = switchEl;

    if (curEl.hasClass('active')) {
      parent.removeClass('unfold');
      descEl.show();
      return;
    }

    if (this.edit) {
      return;
    }

    if (curEl.hasClass('simulate')) {
      this.cookie.expire('goType');
      Cookie.set('type', 'demo');
      location.reload();
    } else {
      this.cookie.set('goType', 'real');

      this.getRealToken().then(function(realToken, readLocal) {
        Cookie.set('type', 'real');
        location.reload();
      }, function() {
        parent.removeClass('unfold');
        descEl.text('模拟').show();
        self.cookie.expire('goType');
        Cookie.set('type', 'demo');
      });
    }
  },

  _rejectRealToken: function() {
    this.parent && this.parent.removeClass('unfold');
    this.descEl && this.descEl.text('模拟').show();
    if (!this.isDemo()) {
      Cookie.set('type', 'demo');
      location.reload();
    }
  },

  _getRealToken: function() {
    Cookie.set('type', 'real');
    location.reload();
  },

  _switchTrust: function(e) {
    var curEl = $(e.currentTarget),
      openPriceInputEl = $('#J_OpenPriceInput');

    // 从当前交易详情过来的订单不可修改
    if (this.edit) {
      return;
    }

    try {
      if (curEl.hasClass('close')) {
        this.open = true;
        curEl.removeClass('close');
        openPriceInputEl[0].removeAttribute('disabled');
        var val = openPriceInputEl.val();
        openPriceInputEl.attr('data-price', val);
        openPriceInputEl.val('');

      } else {
        curEl.addClass('close');
        openPriceInputEl.attr('disabled', true);
        var val = openPriceInputEl.attr('data-price');
        openPriceInputEl.val(val);
        openPriceInputEl
          .parent('.wrapper')
          .removeClass('error');
        this._hideError(openPriceInputEl);
        this.open = false;
      }
    } catch (e) {}
  },

  _action: function(e) {
    e.preventDefault();
    e.stopPropagation();
    var curEl = $(e.currentTarget),
      up = false;

    if (curEl.hasClass('disabled')) {
      return;
    }



    // 买跌
    if (!curEl.hasClass('buy-down')) {
      up = true;
    }

    // 24
    if (this.investnow) {
      this.investnowUp = up;
      var params = this.progress.getParams2(this.symbolValue.policy, {
        askPrice: parseFloat(this.askPrice),
        bidPrice: parseFloat(this.bidPrice)
      }, up);

      // getParams2 需要单独计算volume
      var self = this;
      this.getPipValue(this.symbolValue.policy, {
        askPrice: parseFloat(this.askPrice),
        bidPrice: parseFloat(this.bidPrice)
      }, Cookie.get('type')).then(function(pipValue) {
        params.volume = self.progress.investNum / (pipValue * self.symbolValue.policy.default_takeprofit);
        params.volume = params.volume - params.volume % self.symbolValue.policy.min_vol;

        params.type = up ? 'BUY' : 'SELL';

        self._addOrder(params, up, curEl);
        return;
      });

    }

    // var params = this._getParams(up);

    if (!this._validate(up, params.type)) {
      return;
    }

    this._addOrder(params, up, curEl);
  },

  _validate: function(up, cmd) {
    var self = this,
      validateEls = ['#J_OpenPriceInput', '#J_Volumn', '#J_Profit', '#J_Loss'],
      validateFns = ['_priceValidate', '_volumeValidate', '_profitValidate', '_lossValidate'],
      errors = [];


    $.each(validateEls, function(index, item) {
      item = $(item);

      var result = self[validateFns[index]]({
        currentTarget: item,
        cmd: cmd
      }, true, up);
      if (!result) {
        errors.push(item);
      }
    });

    return errors.length > 0 ? false : true;
  },

  _getParams: function(up, cmd) {
    var type;
    var openPrice;

    // buy 使用ask_price, sell 使用bid_price, 这里存在价格为空的可能性, 需要处理
    // 非挂单
    if (!this.open) {
      if (up) {
        openPrice = this.symbolValue.quote.ask_price[0];
      } else {
        openPrice = this.symbolValue.quote.bid_price[0];
      }
    }
    // 挂单使用用户输入的价格
    else {
      openPrice = $('#J_OpenPriceInput').val();
    }

    var params = {
      openprice: openPrice, //$('#J_OpenPriceInput').val(),
      volume: $('#J_Volumn').val(),
      takeprofit: $('#J_Profit').val() || 0,
      stoploss: $('#J_Loss').val() || 0
    };

    if (cmd) {
      params.type = cmd;

      return params;
    }

    // 非挂单
    if (!this.open) {
      type = up ? 'BUY' : 'SELL';
    } else {
      if (up) {
        type = params.openprice < this.price ? 'BUY LIMIT' : 'BUY STOP';
      } else {
        type = params.openprice > this.price ? 'SELL LIMIT' : 'SELL STOP';
      }
    }

    params.type = type;

    return params;
  },

  _addOrder: function(params, up, curEl) {
    var self = this,
      accountType = this.isDemo() ? 'demo' : 'real',
      slippage = parseFloat(this.symbolValue.policy.default_slippage) * parseFloat(this.symbolValue.policy.pip),
      data = {
        access_token: Cookie.get('token'),
        symbol: this.symbol,
        ui: 5, // 二元交易UI
        slippage: slippage
      };

    data = $.merge(params, data);

    if (accountType === 'demo') {
      this._submitOrder(data, accountType, up, curEl);
    } else {

      /* 
       * protrading.html点击“买涨”、“买跌”及
       * order.html点击“立即平仓”后如果需要输入交易密码，
       * 那么输入交易密码后将不再继续进行下单或平仓操作，仅仅回到当前页面。
       */

      this.getRealToken().then(function(realToken, readLocal) {
        data.real_token = realToken;
        if (!readLocal) {
          return;
        }
        self._submitOrder(data, accountType, up, curEl);
      });
    }
  },
  _submitOrder: function(data, accountType, up, curEl) {
    var self = this;

    if (!this.open) {
      data.openprice = up ? this.askPrice : this.bidPrice;
    }
    if (this._isRecommend()) {
      data.openprice = this.openprice;
    }

    var guadan = data.type === 'BUY' || data.type === 'SELL' ? false : true;

    this._showLoad(curEl);

    var params = data;

    /*
    // 关闭这个逻辑
    if (this.investnow) {
        this.investData = params;
        new Investment({
            symbolName: this.symbolValue.policy.name
        });
        return;
    }
    */

    this.ajax({
      url: '/v1/order/open/' + accountType,
      data: data,
      type: 'post'
    }).then((data) => {
      self.orderObject = data.data;
      data = data.data;

      data.name = self.name;
      data.up = up;
      var minQuoteUnit = self.symbolValue.policy.min_quote_unit;

      try {
        data.minQuoteUnit = minQuoteUnit.split('.')[1].split('').length;
      } catch (e) {
        data.minQuoteUnit = minQuoteUnit;
      }
      data.guadan = guadan;



      this.popup && this.popup.destroy();

      this.popup = new Popup(data);


      // var html = self.render(successTmpl, data);
      // new Dialog({
      //     isShow: true,
      //     tmpl: html
      // });

      self.getAccount().then(function(account) {
        if (! self.profileObject) {
          self.profileObject = new Object ();
        }
        self.profileObject.avatar = account.avatar ? Config.getAvatarPrefix(account.avatar) : '';
        self.profileObject.nickname = account.nickname;

        if (self.isWeixin()) {
          var doc = $(document);

          $('#J_Success').prepend('<a class="dialog-btn share J_Share" href="javascript:">分享此笔交易</a>');

          doc.on('tap', '#J_Success .J_Share', $.proxy(function() {
            $('#J_InfoImg').css('display', 'block');
          }, this));

          doc.on('tap', '#J_InfoImg', $.proxy(function() {
            $('#J_InfoImg').css('display', 'none');
          }, this));

          self.setupWeiXinShare('order');
        } else if (Config.isAndroidAPK()) {
          var avatar = self.profileObject.avatar;
          if (avatar && avatar.indexOf('http') == -1) {
            avatar = "http:" + avatar;
          }
          var nick = self.profileObject.nickname;
          
          var title = (nick || '我') + ' 买' + (self.orderObject.cmd.indexOf('buy') != -1 ? '涨' : '跌') + self.orderObject.symbolName + ', 你怎么看?'; // 分享标题
          var desc = getWXCurrentDesWL(); // '点击查看详情';
          var imgUrl = avatar || getWXIconWL(); // Config.getAndroidSharePrefix() + '/img/share.jpg';
          var link = Config.getAndroidSharePrefix() + '/s/order-share.html?order=' + self.orderObject.ticket + '&symbol=' + self.orderObject.symbol + '&name=' + self.orderObject.symbolName + '&invite=' + Cookie.get('inviteCode') + '&nickname=我&cmd=' + self.orderObject.cmd; // 分享链接

          var l = 'invhero-android:shareOrder?title=' + encodeURIComponent(title) + '&desc=' + encodeURIComponent(desc) + '&imgUrl=' + encodeURIComponent(imgUrl) + '&link=' + encodeURIComponent(link);

          // 添加分享按钮
          $('#J_Success').prepend('<a class="dialog-btn share J_Share" href="' + l + '">分享此笔交易</a>');
        } else {
          $('.dialog-trade').css('height', '17rem');
        }

      });

    }, function(data) {
      // 统一在io里处理

      // new Toast('服务器出错了');
      curEl.text(curEl.attr('data-name'));
    });
  },

  _invest: function() {
    var data = this.investData;
    //var params = new Uri().getParams();
    var volume = data.volume;


    var params = this.progress.getParams({
      askPrice: parseFloat(this.askPrice),
      bidPrice: parseFloat(this.bidPrice)
    }, parseFloat(this.symbolValue.policy.min_quote_unit), this.investnowUp);

    params = $.merge(data, params);
    params.volume = volume;


    data.openprice = this.cmd === 'buy' ? this.askPrice : this.bidPrice;
    data.openprice = parseFloat(data.openprice);
    // data.takeprofit = params.takeprofit || 0; // this.cmd === 'buy' ? data.openprice + params.takeProfitInPip * this.symbolValue.policy.min_quote_unit : data.openprice - params.takeProfitInPip * this.symbolValue.policy.min_quote_unit;
    // data.stoploss = params.stoploss || 0; //this.cmd === 'buy' ? data.openprice - params.stopLossInPip * this.symbolValue.policy.min_quote_unit : data.openprice + params.stopLossInPip * this.symbolValue.policy.min_quote_unit;
    data.real_token = this.cookie.get('real_token');

    // var fix = this.symbolValue.policy.min_quote_unit.toString().length - 2;
    // data.takeprofit = data.takeprofit.toFixed(fix);
    // data.stoploss = data.stoploss.toFixed(fix);

    this.ajax({
      url: '/v1/order/open/real',
      data: data,
      type: 'post'
    }).then((data) => {
      this.cookie.set('type', 'real');
      data = data.data;

      location.href = '../order.html?order=' + data.ticket + '&symbol=' + data.symbol + '&name=' + data.symbolName + '&router=trade' + '&unit=' + this.unit, +'&price=' + data.openPrice;
    }, (data) => {
      if (data.status == 151) {
        this._showDialogError('价格波动过快，无法建仓... <br/>24小时内选择感兴趣的投资品种<br/> 交易盈利后，仍可免费出金！', true);
      }

    });

  },

  _ModifyOrder: function(params, up, curEl) {

    var minUnit;

    try {
      minUnit = this.symbolValue.policy.min_quote_unit.split('.')[1].split('').length;
    } catch (e) {
      minUnit = this.symbolValue.policy.min_quote_unit;
    }

    var self = this,
      accountType = this.isDemo() ? 'demo' : 'real',
      sl = parseFloat(params.stoploss).toFixed(minUnit),
      tp = parseFloat(params.takeprofit).toFixed(minUnit),
      data = {
        access_token: Cookie.get('token'),
        stoploss: sl,
        takeprofit: tp,
        expiration: ""
      };

    data = $.merge(params, data);
    data.openprice = '';

    if (accountType === 'demo') {
      this._submitModifyOrder(data, accountType, up, curEl);
    } else {
      this.getRealToken().then(function(realToken) {
        data.real_token = realToken;
        self._submitModifyOrder(data, accountType, up, curEl);
      });
    }
  },
  _submitModifyOrder: function(data, accountType, up, curEl) {
    var self = this;


    if (!this.open) {
      data.openPrice = up ? this.askPrice : this.bidPrice;
    }

    this._showLoad(curEl);

    this.ajax({
      url: '/v1/order/' + this.order,
      data: data,
      type: 'put'
    }).then(function(data) {
      // data = data.data;

      // data.name = self.name;
      // data.up = up;
      // var minQuoteUnit = self.symbolValue.policy.min_quote_unit;

      // data.minQuoteUnit = minQuoteUnit.split('.')[1].split('').length;

      // var html = self.render(successTmpl, data);
      // new Dialog({
      //     isShow: true,
      //     tmpl: html
      // });
      new Toast('修改成功');
      setTimeout(() => {
        $('#J_NavBack').trigger('click');
      }, 2000);
    }, function(data) {
      // 统一在io里处理
      /*
      var errorCode = new String(data.status);

      var str = errorCode + ": ";
      if (self.errorMessage[errorCode])
          str += self.errorMessage[errorCode];                
      else 
          str += "未知错误";

              new Toast(str);
      */
      // new Toast('服务器出错了');
      curEl.text(curEl.attr('data-name'));
    });
  },

  _selectRange: function(e) {
    var curEl = $(e.currentTarget),
      index = curEl.index(),
      buttonEls = document.getElementsByClassName('highcharts-button'),
      buttonEl = $(buttonEls[index]);

    var types = this.types;
    var type = types[index];


    this._getCandle(type, true);

    this.chartInstance.showLoading();
    curEl.addClass('active');
    curEl.siblings().removeClass('active');
  },

  _getNowDateFormate: function(now) {
    var date = now ? new Date(now) : new Date(Date.now() - 60 * 60 * 24 * 1000);
    var displayTime = date.Format("yyyy-MM-dd HH:mm:ss").substring(0, 10);

    return displayTime;
  },

  _getCurPrice: function(interval) {
    var self = this,
      router = this.router,
      type = this.isDemo() ? 'demo' : 'real';

    return this.getCurrentPrice(this.symbol, true).then((priceInfo) => {

      self.price = priceInfo.price;
      if (!priceInfo.ask_price || !priceInfo.bid_price) {
        self.openPrice = '--';

        return;
      }
      self.askPrice = priceInfo.ask_price[0];
      self.bidPrice = priceInfo.bid_price[0];

      // self.shouldChartUpdate(priceInfo);
      var unit = this.unit.split('.')[1].length;
      var curPrice = parseFloat(((parseFloat(self.askPrice) + parseFloat(self.bidPrice)) / 2).toFixed(unit));
      this.chart && this.chart.addPoint([
        Date.now(), curPrice
      ]);
      $('#J_CurPrice').text((self.bidPrice));

      this.chart && this.chart.shouldChartUpdate(priceInfo);

      self.openPrice = (+priceInfo.ask_price[0] + (+priceInfo.bid_price[0])) / 2;
      if (self.unit) {
        // try {
        //     self.openPrice.toFixed(self.unit.split('.')[1].length);
        // } catch (e) {

        // }

        // self.askPrice.toFixed(n);
        // self.bidPrice.toFixed(n);
      }

      if (!self.guadan && self.orderObject) {
        self.getFloatingProfit(self.account, [self.orderObject], [self.orderObject.symbol]).then(function(floatProfit) {
          $('#J_FloatProfit').text(floatProfit.toFixed(2));
        });
      }

      if (self._getCacheCurPrice()) {
        return self.cacheCurPrice;
      }

      if (self.openprice && self.cmd && self.openPrice && !interval) {
        if (Math.abs(self.openprice - self.openPrice) >= 5 * self.unit) {
          $('.J_Trusteeship').trigger('tap');
        }
      }

      return self._getData(interval);
    });
  },

  _getCacheCurPrice: function() {
    return this.cacheCurPrice;
  },

  _setCacheCurPrice: function(price) {
    var self = this;
    clearTimeout(this.cachePriceTimer);

    this.cacheCurPrice = price;

    this.cachePriceTimer = setTimeout(function() {
      self.cacheCurPrice = null;
    }, self.getCandleExpireTime());

  },

  _nav: function(price) {

    var backEl = $('#J_NavBack');
    var link = backEl.attr('href');
    link += '&price=' + price;
    backEl.attr('href', link);
  },

  _getData: function(interval) {
    var self = this,
      symbol = this.symbol,
      date = this._getNowDateFormate(self.closeTime);

    return this.ajax({
      url: this.candleUrl,
      data: {
        id: symbol,
        tf: 'd1',
        group_name: Cookie.get('type') == 'real' ? Cookie.get('real_group') : Cookie.get('demo_group')
          // start_time: date
      },
      unjoin: true
    }).then(function(data) {
      data = data.data;

      var priceData = data.price.slice(data.price.length - 2);

      var price = priceData[1];
      var yesterdayPrice = priceData[0];
      var unit;

      try {
        unit = self.unit ? self.unit.split('.')[1].length : 2;
      } catch (e) {
        unit = self.unit;
      }

      var infoEl = $('#J_Info');

      if (price) {
        price.price = self.price;
        price.unit = unit;

        // 定时刷新逻辑
        if (interval) {
          self._setCacheCurPrice(price);

          return price;
        }

        price.close = yesterdayPrice.close;

        var up = price.price - price.close > 0 ? true : false;


        self.priceInfo = price;
        self.render(infoTmpl, price, infoEl);
        up ? infoEl.addClass('up') : infoEl.removeClass('up');

        self._setInterval();
      }

      // 当天无价格
      if (!price && yesterdayPrice) {
        var up = true; // 默认上涨
        self.render(infoTmpl, {
          close: yesterdayPrice.close,
          up: true
        }, infoEl);

        up ? infoEl.addClass('up') : infoEl.removeClass('up');
      }
    });
  },

  _setInterval: function() {
    var self = this;

    this._getCurPrice(true).then(function(curPriceInfo) {

      // 绘图用bidPrice
      var up = self.price - self.priceInfo.close > 0 ? true : false;
      var infoEl = $('#J_Info');
      var openPriceInputEl = $('#J_OpenPriceInput');
      // var openPrice = curPriceInfo.bid_price + curPriceInfo.ask_price

      // 把bidPrice和askPrice传给info条
      curPriceInfo.bidPrice = self.bidPrice;
      curPriceInfo.askPrice = self.askPrice;
      curPriceInfo.price = self.price;
      try {
        curPriceInfo.floatCount = self.unit ? self.unit.split('.')[1].length : 2;
      } catch (e) {
        curPriceInfo.floatCount = 0;
      }
      curPriceInfo.close = self.priceInfo.close;
      // var point = [
      //   Date.now(),
      //   parseFloat(((parseFloat(self.askPrice) + parseFloat(self.bidPrice)) / 2).toFixed(unit))
      // ];
      var unit = self.unit.split('.')[1].length;
      var curPrice = parseFloat(((parseFloat(self.askPrice) + parseFloat(self.bidPrice)) / 2).toFixed(unit));
      var point = [Date.now(), curPrice];
      // console.log(curPrice, self.askPrice, self.bidPrice)
      // var point = [
      //   Util.getTime(curPriceInfo.beijing_time),
      //   curPriceInfo.open,
      //   curPriceInfo.high,
      //   curPriceInfo.low,
      //   curPriceInfo.close
      // ];
      // if (chartType === 'area') {
      //     list.push([
      //       Util.getTime(item.beijing_time),
      //       parseFloat(((item.open + item.close) / 2).toFixed(unit))
      //     ]);
      //   }

      self.render(infoTmpl, curPriceInfo, infoEl);
      up ? infoEl.addClass('up') : infoEl.removeClass('up');


      // self.priceInfo = parseFloat(curPriceInfo);
      self.priceInfo = curPriceInfo;

      // 修改订单不应该更新当前价格
      if (!self.open && !self.edit) {

        try {
          self.openPrice = parseFloat(self.openPrice).toFixed(self.askPrice.split('.')[1].length);
        } catch (e) {
          self.openPrice = parseFloat(self.openPrice);
        }

        !self._isRecommend() && openPriceInputEl.val(self.openPrice);
        self._priceValidate({
          currentTarget: openPriceInputEl
        });
      }

      if (self.chart) {
        // 绘图用bidPrice
        // self.chart.updatePlotLine(self.price, up);
        // $('.J_CurPrice').text(self.price);
        $('#J_CurPrice').text(self.bidPrice);

        var lastData = self.lastData;
        // 绘图使用bidPrice
        var curPrice = parseFloat(self.price);

        // time open high low close
        try {
          // lastData[0] = Date.now();
          // lastData[1] = point[1];
          // lastData[1]
          // lastData[2] = lastData[2] < curPrice ? curPrice : lastData[2];
          // lastData[3] = lastData[3] > curPrice ? curPrice : lastData[3];
          // lastData[4] = curPrice;

          var unit = self.unit.split('.')[1].length;
          self.chart.addPoint(
            point
          );
        } catch (e) {
          console.log(e);
        }
      }

      if (self.curState === 'close' && self.refresh) {
        return;
      }
      self.refresh = true;

      setTimeout(function() {
        self._setInterval();
      }, self.getIntervalTime());
    });
  },

  _initAttrs: function() {
    var params = new Uri().getParams();

    this.name = params.name;
    this.symbol = params.symbol;
    this.price = parseFloat(params.price);
    this.order = params.order;
    this.option = params.option;
    this.unit = params.unit;
    this.takeprofit = params.takeprofit;
    this.stoploss = params.stoploss;
    this.openPrice = params.openprice;
    this.openprice = params.openprice;
    this.volume = params.volume;
    this.cmd = params.cmd;

    var fullRouter = params.fullRouter;
    var kw = params.kw;
    var router = params.router;
    var accountType = params.account;

    this._investBtn(params);


    // if (params.from === 'edit') {
    //     this.edit = true;
    // }


    if (this.name) {
      this.setTitle(this.name);
    }

    // this.optionAdd = this.option === 'add' ? true : false;

    // var html = this.option === 'add' ? '<span class="option add">添加自选</span>' : '<span class="option">移除自选</span>';
    // $('#J_Header').append(html);

    // if (this.edit) {
    //     this._initInput();
    // }

    var link;

    if (router === 'order') {
      link = './order.html?name=' + this.name + '&symbol=' + this.symbol + '&order=' + this.order + '&price=' + this.price + '&stoploss=' + this.stoploss + '&takeprofit=' + this.takeprofit;
    } else if (router === 'list') {
      link = kw !== undefined ? './' + router + '.html?kw=' + kw : './' + router + '.html';
    } else {
      link = './' + router + '.html';
    }

    if (fullRouter) {
      link = fullRouter;
    }

    if (params.src) {
      link = params.src;
    }

    $('#J_NavBack').attr('href', link);

    if (accountType) {
      var type = this.cookie.get('type');
      if (accountType === 'demo' && type !== 'demo') {
        this.cookie.set('type', 'demo');
        location.reload();
      } else if (accountType === 'real' && type !== 'real') {
        this.cookie.set('type', 'real');
        location.reload();
      }
    }
  },

  _investBtn: function(params) {
    this.params = params || this.params;

    // 如果链接里有cmd参数, 那么就锁定下单按钮
    if (this.params.cmd) {
      if (this.params.cmd.indexOf('buy') != -1) {
        $('.action.buy-down').addClass('disabled');
      } else if (this.params.cmd.indexOf('sell') != -1) {
        $('.action.buy-up').addClass('disabled');
      }
    }

    // 投资推荐: disable一个按钮
    if (this.params.deal === 'recommend') {
      this.recommend = true;
      if (this.cmd === 'buy') {
        $('.action.buy-down').addClass('disabled');
      } else {
        $('.action.buy-up').addClass('disabled');
      }
    }

    // 马上投资
    if (this.params.deal === 'investnow') {
      this.investnow = true;

      if (this.cmd === 'buy') {
        $('.action.buy-down').addClass('disabled');
        $('.action.buy-up').addClass('shake');
      } else if (this.cmd === 'sell') {
        $('.action.buy-up').addClass('disabled');
        $('.action.buy-down').addClass('shake');
      }
      // 不封锁交易方向
      else {
        $('.action.buy-down').addClass('shake');
        $('.action.buy-up').addClass('shake');
      }

      $('.content').addClass('invest');

    }
  },

  _isRecommend: function() {
    return this.openprice && this.cmd;
  },

  _initInput: function() {
    $('.J_Edit').prop('disabled', true);
    if (this.isDemo()) {
      $('.charge').attr('href', './recharge-demo.html');
    }
  },

  _getStartTime: function() {
    var self = this;
    var d = new $.Deferred();

    if (this.startTime) {
      d.resolve(this.startTime, this.endTime);
    }

    this.ajax({
      url: '/v1/symbols/closetime/',
      data: {
        symbols: this.symbol
      }
    }).then(function(data) {
      if (data && data.data) {
        data = data.data;
        var symbol = data[self.symbol];

        try {
          self.startTime = Util.getTime(symbol[0].start);
          self.endTime = Util.getTime(symbol[0].end);
        } catch (e) {
          self.startTime = Date.now();
        }

        d.resolve(self.startTime, self.endTime);
      }
    });

    return d.promise();
  },

  _getCandle: function(type, refresh, chartType) {
    var self = this;

    if (type === 'up') {
      // debugger
    }

    if (type) {
      this.candleType = type;
    } else {
      type = this.candleType;
    }

    var map = {
      m1: 60,
      m5: 5 * 60,
      m15: 15 * 60,
      m30: 30 * 60,
      h1: 60 * 60,
      d1: 24 * 60 * 60
    };

    this.ajax({
      url: this.candleUrl,
      dateType: 'jsonp',
      data: {
        id: this.symbol,
        //start_time: Util.formateTime((this.startTime || Date.now()) - (map[type] * 1000 * 50), "yyyy-MM-dd HH:mm:ss"),
        tf: type,
        group_name: Cookie.get('type') == 'real' ? Cookie.get('real_group') : Cookie.get('demo_group')
      },
      unjoin: true,
    }).then((data) => {
      //x,open,high,low,close

      data = data.data;

      var unit = this.unit.toString().split('.')[1].length;

      var list = [];
      for (var i = data.price.length - 1, count = 0; i > 0; i--) {
        var item = data.price[i];
        ++count;

        if (chartType === 'area') {
          list.push([
            Util.getTime(item.beijing_time),
            parseFloat(((item.open + item.close) / 2).toFixed(unit))
          ]);
        } else {
          list.push([
            Util.getTime(item.beijing_time),
            item.open,
            item.high,
            item.low,
            item.close
          ]);

          if (count > 50) {
            break;
          }
        }

      }
      list = list.sort(function(a, b) {
        return a[0] > b[0] ? 1 : -1;
      });

      self.lastData = list[list.length - 1];


      if (self.chart) {
        try {
          var chart = self.chartInstance;
          chart.series[0].setData(list);
          chart.hideLoading();

          if (refresh && self.curState == 'close') {
            self.refresh = false;
            self._getData();
          }
        } catch (e) {}

        return;
      }

      // create the chart
      self.chart = new Chart({
        data: list,
        price: self.price,
        up: false,
        stockName: self.name,
        selectedIndex: self.types.indexOf(type)
      });
      self.type = 'up';
      self.chartInstance = self.chart.instance;
    });
  },

  _initChart: function() {
    var self = this;

    this._getCandle('m30', false, 'area');
  },

  _actionOption: function(data) {
    // 添加
    this._option(data.add);
  },

  _option: function(add) {
    var self = this;
    //     curEl = $(e.currentTarget),
    //     add = curEl.hasClass('add');

    // e.preventDefault();
    // this.curEl = curEl;

    if (add) {

      this.ajax({
        url: '/v1/user/fav/symbol/',
        type: 'post',
        data: {
          symbol: this.symbol,
          access_token: Cookie.get('token')
        }
      }).then(function(data) {
        self.add = true;
        // self._callback();
        // new Toast('添加成功');
        self._add(self.symbol);
        self.broadcast('action:option:success');
      });
    } else {

      // if (!this.delDialog) {
      //     this._initDialog();
      // }
      // this.delDialog.show();
      this._removeFav();
    }
  },

  _add: function(symbol) {
    var optionList = this._getOptionList();

    if (optionList.indexOf(symbol) === -1) {
      optionList.push(symbol);
      this._setOptionList(optionList);
    }
  },

  _del: function(symbol) {
    var optionList = this._getOptionList();

    var index = optionList.indexOf(symbol);

    if (index !== -1) {
      optionList.splice(index, 1);
      this._setOptionList(optionList);
    }
  },


  _getOptionList: function() {
    var key = this._getKey();

    var optionList = JSON.parse(storage.get(key));

    return optionList;
  },

  _getKey: function() {
    var key = this.isDemo() ? 'demoOptionList' : 'optionList';
    var token = Cookie.get('token');

    return token + key;
  },

  _setOptionList: function(optionList) {
    var key = this._getKey();
    var optionList = storage.set(key, optionList);
  },

  _saveOptionData: function(data) {
    var optionList = [],
      key = this._getKey();

    $.each(data, function(index, item) {
      var symbol = item.policy.symbol;
      optionList.push(symbol);
    });

    storage.set(key, optionList);

    return optionList;
  },

  _callback: function() {
    // if (this.add) {
    //     this.curEl.html('移除自选');
    //     this.curEl.removeClass('add');
    //     return;
    // }

    // this.curEl.html('添加自选');
    // this.curEl.addClass('add');
  },

  _removeFav: function() {
    var self = this;

    this.ajax({
      url: '/v1/user/fav/symbol/',
      type: 'delete',
      data: {
        symbol: this.symbol,
        access_token: Cookie.get('token')
      }
    }).then(function(data) {
      // self.add = false;
      // self._callback();
      self._del(self.symbol);
      self.broadcast('action:option:success');
    });
  },

  _initDialog: function() {
    this.delDialog = new Dialog({
      isShow: false,
      confirmAndClose: true,
      tmpl: this.delTmpl,
      confirmCallback: $.proxy(this._removeFav, this)
    });
  },

  _getSymbol: function(type) {
    var self = this,
      type = this.isDemo() ? 'demo' : 'real';

    this.getAccount().then((data) => {
      self.account = data.account;

      self.ajax({
        url: '/v3/' + type + '/symbols6/',
        data: {
          symbols: self.symbol,
          access_token: Cookie.get('token')
        }
      }).then((data) => {
        data = data.data[0];
        self.symbolValue = data;
        self.unit = data.policy.min_quote_unit;

        // this._initChart();
        this.chart = new Chart({
          symbol: this.symbol,
          unit: this.unit.toString().split('.')[1].length
        });



        self.name = data.policy.name;
        self.setTitle(self.name);

        var leverage = self._getLeverage(data, self.account);
        data.leverage = leverage;

        if (!self.edit) {
          if (self.openprice && self.cmd && self.openPrice) {
            if (Math.abs(self.openprice - self.openPrice) >= 5 * self.unit) {
              $('.J_Trusteeship').trigger('tap');
              self.initGuadan = true;
              data.guadan = true;
              self.open = true;
            }
          }

          self.render(symbolInfoTmpl, data, $('#J_FormHD'));
        }

        if (self.edit) {
          self._getOrder();
          return;
        }
        self._getMargin(data);
        self._lazyBind();
        self._initFooter(data, self.account);
      });

      self._getAccount();
    });


  },

  _getAccount: function() {
    var self = this,
      type = self.isDemo() ? 'demo' : 'real';

    this.getCurrentOrderList().then((data) => {
      this.getFloatingProfit(this.account, data.list, data.symbols).done((profit) => {
        var netDeposit = parseFloat(self.account[type].balance) + parseFloat(profit);
        var freeMargin = netDeposit - parseFloat(data.margin);

        var rate = data.margin === 0 ? '--' : ((netDeposit / parseFloat(data.margin)) * 100).toFixed(2);
        var rate = rate === '--' ? '--' : parseFloat(rate);

        $('.J_Total').text((freeMargin).toFixed(2));

        var defaultFreeMargin = Config.getFreeMargin();

        if (!this.progress) {

          this.progress = new Progress({
            freeMargin: freeMargin
              /*,
              policy: self.symbolValue.policy,
              price: self.price
              */
          });
        } else {
          this.progress.update(freeMargin);
        }

        // self.render(accountTmpl, {
        //     netDeposit: netDeposit,
        //     freeMargin: freeMargin,
        //     rate: rate,
        //     type: type,
        //     eidt: self.edit
        // }, $('#J_AccountBanner'));
        // self._lazyBindAccount();

        this.freeMargin = freeMargin;
        this.fire('get:freeMargin', freeMargin);
      });
    });
  },

  _getOrder: function(type) {
    var self = this;
    var data = {
      order: this.order,
      _r: Math.random()
    };
    if (!this.isDemo()) {
      data.access_token = Cookie.get('token')
    };

    this.ajax({
      url: '/v1/order/' + this.order,
      data: data
    }).then(function(data) {
      data = data.data;
      self.slippage = data.slippage;
      self.profit = data.profit;
      self.cmd = data.cmd;
      self.orderObject = data;

      var guadan = false;
      self.open = false;

      // 挂单
      if (data.status == 'pending') {
        guadan = true;
        self.open = true;
        $('.J_Trusteeship').removeClass('close');
      }

      self.guadan = guadan;

      if (self._isRecommend()) {
        data.openprice = self.openprice;
      }

      if (data.status === 'open')
        self.open = true;

      self._initFooter(self.symbolValue, self.account, {
        guadan: guadan,
        edit: true
      });

      data.edit = true;
      data.leverage = self._getLeverage(self.symbolValue, self.account);
      data.stopLoss = self.stoploss;
      data.takeProfit = self.takeprofit;


      // 这句话有问题, 应该使用从链接取过来的openprice
      // data.openPrice = self.openPrice;
      var formHDEl = $('#J_FormHD');
      formHDEl.addClass('edit');
      self.render(symbolInfoTmpl, data, formHDEl);
      self.render(orderTmpl, data, $('#J_FormBD'));
      /*
      self.volume = data.volume;
      self.openPrice = data.openPrice;
      self.stopLoss = data.stopLoss;
      self.takeProfit = data.takeProfit;
      */
      self._getFloatMoney();
      self._getMargin(self.symbolValue);
      self._lazyBind();

      // 挂单无需处理
      if (guadan) {
        return;
      }

      self.getFloatingProfit(self.account, [data], [data.symbol]).then(function(floatProfit) {
        $('#J_FloatProfit').text(floatProfit.toFixed(2))
      })
    });
  },

  /**
   * 获取交易品种的交易杠杆 (实际上这段代码就是calMarginWithOpenPrice方法中的一部分)
   * symbol: 从2.2.2.4 接口获取的symbol对象
   * account: 从2.2.2.5 接口获取的account对象
   **/
  _getLeverage: function(symbol, account) {
    var type = this.isDemo() ? 'demo' : 'real';
    var max_leverage = this.isDemo() ? symbol.policy.demo_max_leverage : symbol.policy.real_max_leverage;
    var trading_leverage = account[type].leverage * symbol.policy.leverage_multiplier;
    max_leverage = parseFloat(max_leverage);
    trading_leverage = parseFloat(trading_leverage);

    trading_leverage = trading_leverage < max_leverage ? trading_leverage : max_leverage;

    return trading_leverage;
  },

  _getFloatMoney: function() {
    var self = this,
      volume, openPrice, takeProfit, stopLoss;

    // 这块代码没看懂, 暂时替换
    /*
    if (this.edit) {
        volume = this.volume;
        openPrice = this.openPrice;
        stopLoss = this.stopLoss;
        takeProfit = this.takeProfit;
    } else {
        volume = $('#J_Volumn').val();
        openPrice = $('#J_OpenPriceInput').val();
        stopLoss = $('#J_Loss').val();
        takeProfit = $('#J_Profit').val();
    }
    */

    volume = $('#J_Volumn').val();
    openPrice = $('#J_OpenPriceInput').val();
    stopLoss = $('#J_Loss').val();
    takeProfit = $('#J_Profit').val();


    this.calMoney(this.account, this.symbolValue, volume, openPrice, stopLoss, takeProfit).then(function(price) {
      // var fixed = Math.round(1 / self.symbolValue.policy.min_quote_unit).toString().length - 1;
      // 目标和止损金额是2位小数
      var fixed = 2;

      var profit = price.takeProfit.toFixed(fixed),
        loss = price.stopLoss.toFixed(fixed);

      if (!isNaN(profit)) {
        $('#J_ProfitCount').text(profit);
      }
      if (!isNaN(loss)) {
        $('#J_LossCount').text(loss);
      }

    }).fail(function() {});
  },

  _getMargin: function(symbol) {
    var self = this;

    this.getMargin(self.price, symbol, 1, this.account).then(function(margin) {
      if (!self.edit) {
        try {
          var minUnit = self.symbolValue.policy.min_quote_unit.split('.')[1].split('').length;
        } catch (e) {
          var minUnit = self.symbolValue.policy.min_quote_unit;
        }

        var p = (parseFloat(self.symbolValue.quote.ask_price[0]) + parseFloat(self.symbolValue.quote.bid_price[0])) / 2;
        p = p.toFixed(minUnit);

        self.render(orderTmpl, {
          margin: margin,
          price: p, // self.price
          stopLoss: self.stoploss,
          takeProfit: self.takeprofit,
          guadan: self.initGuadan,
          openprice: self._isRecommend() ? self.openprice : undefined

        }, $('#J_FormBD'));
      }

      // 由于获取freeMargin是异步的，不知道谁先谁后
      if (self.freeMargin !== undefined) {
        getVolume();
      } else {
        self.on('get:freeMargin', getVolume, this);
      }

      // 计算最大交易量
      function getVolume() {
        if (self.openPrice == '--') {

          $('#J_Volumn').val(symbol.policy.min_vol);
          return;
        }
        self.calVolume(symbol, self.account, self.freeMargin).then(function(volumn) {
          if (!self.edit) {
            if (volumn.maxVolume > 0 && volumn.volume <= 0) {
              volumn.volume = symbol.policy.min_vol;
            }

            var volume = volumn.volume;

            //if (self.volume && self.volume >= volumn.volume && self.volume <= volumn.maxVolume) {
            if (self.volume && self.volume >= symbol.policy.min_vol && self.volume <= volumn.maxVolume) {
              volume = self.volume;
            }

            $('#J_Volumn').val(volume);
          }

          $('#J_MaxVolumn').text(volumn.maxVolume);
          self.maxVolume = volumn;
        });
      }
    });
  },

  _initFooter: function(symbolValue, account, params) {
    var self = this,
      accountType = this.isDemo() ? 'demo' : 'real';

    this.checkStatus(symbolValue, account).then(function(data) {
      data.accountType = accountType;

      // 如果是休市 无需刷新价格
      if (data.type === 'close') {
        // self.closeTime = Util.getTime(data.closeTime) - 1;
        self.closeTime = Util.getTime(data.closeTime) - 60 * 60 * 24 * 1000;
        self._getData();
        self.curState = 'close';
      }

      if (params) {
        data = $.merge(data, params);
      }

      self.render(footerTmpl, data, $('#J_Footer'));
      self._investBtn();
    });

  },

  _showLoad: function(curEl) {
    this.loadEl = curEl;

    var txt = curEl.text();
    curEl.attr('data-name', txt);
    curEl.html('<span>处理中<span class="dialog-load"></span></span>');
  },

  _hideLoad: function() {
    var name = this.loadEl.attr('data-name');
    this.loadEl.text(name);
  },

  _showDialogError: function(msg, stay) {
    var self = this;

    this.dialog = new Dialog({
      isShow: true,
      tmpl: this.render(dialogErrorTmpl, {
        msg: msg
      }),
      cancleCallback: function() {
        this.destroy();

        // if (!stay) {
        self.cookie.set('type', 'real');

        location.href = '../option.html';
        // }


      }
    });
  },

  attrs: {

    delTmpl: [
      '<div class="dialog J_Dialog del-dialog " id="J_Dialog">',
      '   <span class="wrapper-icon"><span class="icon"></span></span>',
      '   <div class="dialog-content J_Content">',
      '        <p>确认删除自选？</p>',
      '   </div>',
      '   <div class="dialog-buttons clearfix">',
      '       <span class="dialog-btn J_DialogClose">取消</span>',
      '       <span class="dialog-btn J_DialogConfirm">删除</span>',
      '   </div>',
      '</div>',
      '<div class="dialog-mask J_DialogMask"></div>'
    ].join(''),

    // addTmpl: [
    //     '<div class="dialog J_Dialog add-dialog " id="J_Dialog">',
    //     '   <span class="wrapper-icon"><span class="icon"></span></span>',
    //     '   <div class="dialog-content J_Content">',
    //     '        <p>已添加到自选</p>',
    //     '   </div>',
    //     '   <div class="dialog-buttons clearfix">',
    //     '       <span class="dialog-btn J_DialogClose">确认</span>',
    //     '   </div>',
    //     '</div>',
    //     '<div class="dialog-mask J_DialogMask"></div>'
    // ].join(''),

    passwordTmpl: [
      '<div class="dialog J_Dialog setup-dialog " id="J_Dialog">',
      '   <span class="wrapper-icon"><span class="icon"></span></span>',
      '   <div class="dialog-content J_Content">',
      '       <p class="title">为保证您的实盘账户资金安全，',
      '       <p class="title">请输入交易密码</p>',
      '       <div class="input-wrapper">',
      '           <input type="password" placeholder="请输入交易密码">',
      '           <p class="message">实盘交易密码错误!</p>',
      '       </div>',
      '   </div>',
      '   <div class="dialog-buttons clearfix">',
      '       <span class="dialog-btn J_DialogClose">取消</span>',
      '       <span class="dialog-btn J_DialogConfirm">确认</span>',
      '   </div>',
      '</div>',
      '<div class="dialog-mask J_DialogMask"></div>'
    ].join(''),

    setupTmpl: [
      '<div class="dialog J_Dialog setup-dialog " id="J_Dialog">',
      '   <span class="wrapper-icon"><span class="icon"></span></span>',
      '   <div class="dialog-content J_Content">',
      '       <p class="title">为保证您的实盘账户资金安全，',
      '       <p class="title">请设置交易密码并妥善保存</p>',
      '       <div class="input-wrapper">',
      '           <input type="password" class="first" placeholder="请输入交易密码">',
      '           <input type="password" class="second" placeholder="请再次输入交易密码">',
      '       </div>',
      '       <p class="message">实盘交易密码错误!</p>',
      '   </div>',
      '   <div class="dialog-buttons clearfix">',
      '       <span class="dialog-btn J_DialogClose">取消</span>',
      '       <span class="dialog-btn J_DialogConfirm">设定</span>',
      '   </div>',
      '</div>',
      '<div class="dialog-mask J_DialogMask"></div>'
    ].join(''),

    types: ['m1', 'm5', 'm15', 'm30', 'h1', 'd1']
  }
});

new ProTrading();