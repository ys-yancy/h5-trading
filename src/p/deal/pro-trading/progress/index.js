'use strict';

var Base = require('../../../../app/base');
var Config = require('../../../../app/config');
var Toast = require('../../../../common/toast');

export default class Progress extends Base {
  constructor(config) {
    super(config);

    this.progressInnerEl = $('.J_ProgressInner');
    this.width = this.progressInnerEl.width();
    this.offsetLeft = this.progressInnerEl.offset().left;
    this.parentWidth = this.progressInnerEl.parent().width();
    this.investNumEl = $('.J_InvestNum');
    this.investMaxEl = $('.J_InvestMax');
    this.investProfitEl = $('.J_ProfitNum');

    // this.policy = config.policy;
    // this.price = config.price;

    this._bind();
    this._setProgress(.5);
  }

  _bind() {
    var doc = $(document);

    doc.on('touchmove', '.J_ProgressInner', $.proxy(this._update, this));

    doc.on('tap', '.J_Add', $.proxy(this._add, this));
    doc.on('tap', '.J_Minus', $.proxy(this._minus, this));
  }

  _add(e) {
    var invest = this._getInvert();


    if (invest.num + 5 <= invest.max) {
      var per = (invest.num + 5 - invest.min) / (invest.max - invest.min);
      this._setProgress(per);
    } else {
      new Toast('超过最大投资金额');
    }
  }

  _minus(e) {
    var invest = this._getInvert();


    if (invest.num - 5 >= invest.min) {
      var per = (invest.num - 5 - invest.min) / (invest.max - invest.min);
      this._setProgress(per);
    } else {
      new Toast('小于最小投资金额');
    }

  }

  _getInvert() {
    var max = this.getMax2();
    var min = this.getMin2();

    var investNum = +(((max - min) * this.curPer + min).toFixed(2));
    var N = 5;
    var x = Math.floor(this.investNum / 5);
    var y = this.investNum % 5;

    if (y < 2.5) {
      var investNum = x * N;
    } else {
      var investNum = (x + 1) * N;
    }

    return {
      num: investNum,
      max: max,
      min: min
    };
  }

  _update(e) {
    clearTimeout(this.timer);

    this.timer = setTimeout(() => {
      var x = e.changedTouches[0].clientX;
      var left = x - this.offsetLeft - this.width / 2;
      var per = (left + this.width / 2) / this.parentWidth;
      if (x < this.offsetLeft) {
        left = -this.width / 2;
        per = 0;
      } else if (this.offsetLeft + this.parentWidth < x) {
        left = this.parentWidth - this.width / 2;
        per = 1;
      }

      this.progressInnerEl.css('left', left);
      this._progress(per);
    }, 0);
  }

  _setProgress(per) {

    per = per !== undefined ? per : this.per;

    this.progressInnerEl.css('left', this.parentWidth * per - this.width / 2);
    this._progress(per);
  }

  _progress(per) {
    var max = this.getMax2();
    var min = this.getMin2();
    this.curPer = per;

    if (per === 1) {
      this.investMaxEl.parent().show();
    } else {
      this.investMaxEl.parent().hide();
    }

    this.investNum = ((max - min) * per + min).toFixed(2);
    // console.log(max, min, per, (max - min) * per + min);
    // 每次步长为N
    var N = 5;
    var x = Math.floor(this.investNum / 5);
    var y = this.investNum % 5;

    if (y < 2.5) {
      this.investNum = x * N;
    } else {
      this.investNum = (x + 1) * N;
    }

    this.investMaxEl.text(max.toFixed(2));

    this.investNumEl.text(this.investNum.toFixed(2));
    this.investProfitEl.text(this.investNum.toFixed(2));
    // this.investProfitEl.text(((max - min) * per * Config.getProfitIndex() + min).toFixed(2));
  }

  // 每单手数
  // 可用保证金/1000*0.01*杠杆使用率
  getHand() {
    return this.freeMargin / 1000 * 0.01 * Config.getLever();
  }

  // 每单占用保证金
  // 可用保证金*0.01*杠杆使用率
  getDeposit() {
    return this.freeMargin * 0.01 * Config.getLever();
  }

  // 最大盈亏pips
  // （可用保证金-每单占用保证金）/每单手数/10
  getMaxProfitPips() {
    return (this.freeMargin - this.getDeposit()) / this.getHand() / 10;
  }

  // 每pips价值
  // 可用保证金/1000*0.1*杠杆使用率
  getPipsVal() {
    return this.freeMargin / 1000 * 0.1 * Config.getLever();
  }

  // 最大可用投资额($)
  // 最大盈亏pips*每pips价值
  getMax() {
    return this.getMaxProfitPips() * this.getPipsVal();
  }

  // 最大可用投资金额($)
  // 账户净值*10%
  getMax2() {
    var m = this.freeMargin * 0.1;
    return Math.ceil(m >= 5 ? m : 5);
  }

  // 最小可用投资额
  // 可用保证金/1000*杠杆使用率
  getMin() {
    return this.freeMargin / 1000 * Config.getLever();
  }

  // 最小可用投资金额($)
  // 5美元
  getMin2() {
    // return this.freeMargin * 0.05;
    return 5;
  }



  update(freeMargin) {
      this.freeMargin = freeMargin;

      if (this.per) {
        this._progress(this.per);
      }
    }
    // cmd 为 buy 时
    // takeprofit = ask + 盈亏pips
    // stoploss=ask-盈亏pips

  // cmd 为 sell 时
  // takeprofit=bid-盈亏pips
  // stoploss=bid+盈亏pips
  getParams2(symbolPolicy, price, up) {
    var params = null;
    var unit = symbolPolicy.min_quote_unit.toString().split('.')[1].length;

    if (up) {
      params = {
        takeprofit: parseFloat((price.askPrice + symbolPolicy.default_takeprofit * symbolPolicy.pip).toFixed(unit)),
        stoploss: parseFloat((price.askPrice - symbolPolicy.default_stoploss * symbolPolicy.pip).toFixed(unit))
      }
    } else {
      params = {
        takeprofit: parseFloat((price.bidPrice - symbolPolicy.default_takeprofit * symbolPolicy.pip).toFixed(unit)),
        stoploss: parseFloat((price.bidPrice + symbolPolicy.default_stoploss * symbolPolicy.pip).toFixed(unit))
      }
    }
    // 止盈止损金额
    // this.investNum



    // params.volume = parseFloat(this.getHand().toFixed(unit));

    return params;
  }



  // cmd 为 buy 时
  // takeprofit = ask + 盈亏pips
  // stoploss=ask-盈亏pips

  // cmd 为 sell 时
  // takeprofit=bid-盈亏pips
  // stoploss=bid+盈亏pips
  getParams(price, minQuoteUnit, up) {
    var profitPips = this.getProfitPips(minQuoteUnit);
    var params = null;
    var unit = minQuoteUnit.toString().split('.')[1].length;

    if (up) {
      params = {
        takeprofit: parseFloat((price.askPrice + profitPips).toFixed(unit)),
        stoploss: parseFloat((price.askPrice - profitPips).toFixed(unit))
      }
    } else {
      params = {
        takeprofit: parseFloat((price.bidPrice - profitPips).toFixed(unit)),
        stoploss: parseFloat((price.bidPrice + profitPips).toFixed(unit))
      }
    }

    params.volume = parseFloat(this.getHand().toFixed(unit));

    return params;
  }

  // 盈亏pips=（我要投资金额/每pips价值）*价格的最小变化单位
  getProfitPips(minQuoteUnit, unit) {
    return parseFloat(this.investNum / this.getPipsVal() * minQuoteUnit);
  }

}