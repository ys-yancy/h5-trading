'use strict';

var Base = require('../../../../app/page-base');
var Config = require('../../../../app/config');
var Toast = require('../../../../common/toast');
// var Popup = require('../../../pro-trading/popup');
// var dialogTmpl = require('./dialog.ejs.html');
var Util = require('../../../../app/util');

export default class Order extends Base {
  constructor(config) {
    super(config);


    this.switch(this.props.symbolValue, this.props.symbol);
    this.bind();
  }

  bind() {

    $(document).on('click', '.action', (e) => {
      this._action(e);
    });
  }

  switch (symbolValue, symbol) {
    this.symbol = symbol;
    this.symbolValue = symbolValue;

    this.getAccount().then((data) => {
      var account = data.account;
      this.account = data.account;

      this.checkStatus(symbolValue, account).then(function(data) {
        // data.accountType = accountType;

        // 如果是休市 无需刷新价格
        if (data.type === 'close') {
          // self.closeTime = Util.getTime(data.closeTime) - 1;
          self.closeTime = Util.getTime(data.closeTime) - 60 * 60 * 24 * 1000;
          // self._getData();
          self.curState = 'close';

          var str = `<div class="market-close">
            <p>休市</p>
            <p class="desc">下次开始时间 ${data.start}</p>
          </div>`;


          $('.action').parent().html(str);
          // $('.action').addClass('close').text('休市');
        }
      });
    });
  }

  show() {
    if (!this.dialog) {
      this.dialog = this.renderTo(dialogTmpl, {}, document.body);
      $('#J_CommRate').html(Config.getConmissionRate() * 100 + "%");
      this.lazyBind();
    }

    this.dialog.show();
    $('.J_HelpMask').show();
  }

  hide() {
    this.dialog.hide();
    $('.J_HelpMask').hide();
  }

  _action(e) {
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

    var params = this.props.progress.getParams2(this.props.symbolValue.policy, {
      askPrice: parseFloat(this.props.askPrice),
      bidPrice: parseFloat(this.props.bidPrice)
    }, up);
    
    // getParams2 需要单独计算volume
    var self = this;
    this.getPipValue(this.props.symbolValue.policy, {
      askPrice: parseFloat(this.props.askPrice),
      bidPrice: parseFloat(this.props.bidPrice)
    }, this.cookie.get('type')).then((pipValue) => {

      // 存在可能性没读取到price 或者 policy 的情况, pipValue 计算错误, 这里要检查 pipValue是否为0.1
      // if (pipValue != 0.1) {
      //   pipValue = 0.1;
      // }

      if (this.props.progress.investNum() < 5) {
        new Toast('最小下单金额为5元');

        return;
      }

      if (this.props.accountData.freeMargin < 5) {
        new Toast('账户可投资金不足') //可用保证金少于10元');

        return;
      }
      console.log(this.props.progress.investNum() * 1.15);
      console.log(parseFloat($('.J_NetDeposit').html()));
      if (this.props.progress.investNum() * 1.15 > parseFloat($('.J_NetDeposit').html())) {
        new Toast('账户可投资金不足');
        return;
      }
      params.volume = this.props.progress.investNum() / (pipValue * this.symbolValue.policy.default_takeprofit);


      // if (this.props.symbolValue.policy.min_quote_unit < 1) {
      //   var val = 1 / this.props.symbolValue.policy.min_quote_unit;
      //   params.volume = parseInt(params.volume * val) / val
      // } else {
      //   params.volume = parseInt(params.volume - params.volume % this.props.symbolValue.policy.min_quote_unit);
      // }

      // params.volume = params.volume - params.volume % this.symbolValue.policy.min_vol;

      params.type = up ? 'BUY' : 'SELL';

      self._addOrder(params, up, curEl);

    });
  }

  _addOrder(params, up, curEl) {
    var self = this,
      accountType = this.isDemo() ? 'demo' : 'real',
      slippage = parseFloat(this.props.symbolValue.policy.default_slippage) * parseFloat(this.props.symbolValue.policy.pip),
      data = {
        access_token: this.cookie.get('token'),
        symbol: this.props.symbol,
        ui: 6, // 二元交易UI
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
  }

  _submitOrder(data, accountType, up, curEl) {
    var self = this;

    if (!this.open) {
      data.openprice = up ? this.props.askPrice : this.props.bidPrice;
    }
    // if (this._isRecommend()) {
    //   data.openprice = this.openprice;
    // }

    var guadan = data.type === 'BUY' || data.type === 'SELL' ? false : true;

    this._showLoad(curEl);

    var params = data;

    if (!data.volume) {
      new Toast('投资金额不可为空,请输入后再提交');
      this._hideLoad(curEl);
      return;
    }

    if (Math.abs(this.props.askPrice - this.props.bidPrice) > this.props.defaultTakeprofit /2 ) {
      new Toast('当前点差过大,不建议下单,请稍 后重试!');
      return;
    }

    this.ajax({
      url: '/v1/order/open/' + accountType,
      data: data,
      type: 'post'
    }).then((data) => {
      self.orderObject = data.data;
      data = data.data;

      new Toast('交易成功');

      $('.option-list').addClass('show');

      this._hideLoad(curEl);
      this.broadcast('update:account', { fresh: true });

      this.props.currentOrderList.push(data.ticket);

    }, function(data) {
      // 统一在io里处理

      // new Toast('服务器出错了');
      curEl.text(curEl.attr('data-name'));
    });
  }

  _showLoad(curEl) {
    this.loadEl = curEl;

    var txt = curEl.text();
    curEl.attr('data-name', txt);
    curEl.html('<span>处理中<span class="dialog-load"></span></span>');
  }

  _hideLoad() {
    var name = this.loadEl.attr('data-name');
    this.loadEl.text(name);
  }
}
