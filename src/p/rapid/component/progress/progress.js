'use strict';

var Base = require('../../../../app/base');
var Config = require('../../../../app/config');
var Toast = require('../../../../common/toast')
var N = Config.getStepX();

export default class Progress extends Base {
  constructor(config) {
    super(config);

    // this.progressInnerEl = $('.J_ProgressInner');
    // this.width = this.progressInnerEl.width();
    // this.offsetLeft = $('.J_Progress').offset().left;
    // this.parentWidth = this.progressInnerEl.parent().width();
    // this.investNumEl = $('.J_InvestNum');
    // this.investMaxEl = $('.J_InvestMax');
    this.investProfitEl = $('.J_ProfitNum');

    // this.policy = config.policy;
    // this.price = config.price;

    this._bind();
    // this._setProgress(.5);
  }

  _bind() {
    var doc = $(document);

    // doc.on('touchmove', '.J_ProgressInner', $.proxy(this._update, this));

    doc.on('touchstart', '.J_Add', $.proxy(this._add, this));
    doc.on('touchstart', '.J_Minus', $.proxy(this._minus, this));
    $('#money').on('blur', (e) => {
      var curEl = $(e.currentTarget);
      var curVal = curEl.val();

      if (!(!!curVal)) {
        curEl.val(parseInt(this.investNum));
        return;
      }

      this.change(curVal);
    });

    document.addEventListener('change:investnum', (e) => {
      var invest = this._getInvert();

      this.curPer = (e.detail - invest.min) / (invest.max - invest.min);
      this.investNum = e.detail;

      if (this.freeMargin < 5) {
        this.investProfitEl.text('--');
      } else {
        //var a = e.detail * (1 - Config.getConmissionRate()) % 1 == 0 ? e.detail * (1 - Config.getConmissionRate()) + ".0" : e.detail * (1 - Config.getConmissionRate());
        this.investProfitEl.text(e.detail);
        $('#money').val(e.detail);
      }
      // console.log(this.curPer);
    });

    // this.investProfitEl.on('blur', (e) => {
    //   this.change($(e.currentTarget).val());
    // })
  }

  change(val) {
    var max = this.getMax2();
    var min = this.getMin2();
    var maxInv = 2000; //单笔最大限额
    if (val < min) {
      new Toast(`小于最小金额${min}元`);
      val = Config.getStepX();
    } else if (val > max && max >= 5) {
      if (max <= maxInv) {
        new Toast(`超过最大金额${max}元`);
        val = max;
      } else {
        new Toast(`单笔投资上限${maxInv}元`);
        val = maxInv;
      }
    } else if (val > maxInv && val <= max) {
      new Toast(`单笔投资上限${maxInv}元`);
      val = maxInv;
    } else if (val % Config.getStepX() !== 0) {
      new Toast(`投资金额必须为10的倍数`);
    }

    if (val % Config.getStepX() !== 0) {
      val = val - val % Config.getStepX();
    }

    // console.log(val);



    var per = (val - min) / (max - min);
    if (!per && per !== 0) {
      per = 1;
    }

    this._progress(per);
    this.parent.setVal(parseInt(this.investNum, 10));
    // this.investProfitEl.text(parseInt(this.investNum, 10));
    // this.parent.setVal(count);
    // this._setProgress(per);

  }

  _add(e) {

    var invest = this._getInvert();


    if (invest.num + Config.getStepX() <= invest.max) {
      // var per = (invest.num + Config.getStepX() - invest.min) / (invest.max - invest.min);
      this.curPer = (invest.num + Config.getStepX() - invest.min) / (invest.max - invest.min);

      var count = invest.num + Config.getStepX();
      this.investNum = count;

      // this._setProgress(per);
      this.parent.setVal(count);
      //this.investProfitEl.text(count);
    } else {
      new Toast('超过最大投资金额');
    }
  }

  _minus(e) {
    var invest = this._getInvert();


    if (invest.num - Config.getStepX() >= invest.min) {
      this.curPer = (invest.num - Config.getStepX() - invest.min) / (invest.max - invest.min);
      var count = invest.num - Config.getStepX();
      this.investNum = count;
      // this._setProgress(per);
      this.parent.setVal(count);
      // this.investProfitEl.text(count);
    } else {
      new Toast('小于最小投资金额');
    }

  }

  getProgress(per) {
    this._setProgress(per);
  }

  _getInvert() {
    var max = this.getMax2();
    var min = this.getMin2();

    var investNum = +(((max - min) * this.curPer + min).toFixed(2));
    // var N = 5;
    // var x = Math.floor(this.investNum / 5);
    // var y = this.investNum % 5;
    // var x = Math.floor(this.investNum / N);
    // var y = this.investNum / N;

    // if (y < 2.5) {
    //   var investNum = x * N;
    // } else {
    //   var investNum = (x + 1) * N;
    // }



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

    // if (per === 1) {
    //   this.investMaxEl.parent().show();
    // } else {
    //   this.investMaxEl.parent().hide();
    // }

    this.investNum = ((max - min) * per + min).toFixed(2);

   
    // console.log(max, min, per, (max - min) * per + min);
    // // 每次步长为N
    // var N = Config.getStepX();
    // var x = Math.floor(this.investNum / Config.getStepX());
    // var y = this.investNum % Config.getStepX();

    // if (y < 2.5) {
    //   this.investNum = x * N;
    // } else {
    //   this.investNum = (x + 1) * N;
    // }

    // this.investMaxEl.text(max.toFixed(2));

    if (this.freeMargin < 5) {

      this.investProfitEl.text('--');
    } else {

      this.investProfitEl.text(parseInt(this.investNum, 10));
    }

    $('#money').val(parseInt(this.investNum, 10));


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
  // 账户净值*50% 和 预设的单笔最大交易金额的最小值
  getMax2() {
    var m = Math.min(this.freeMargin * 0.85, 2000);
    m -= m % Config.getStepX(); // 删除多余部分
    return Math.ceil(m >= Config.getStepX() ? m : Config.getStepX());
  }

  // 最小可用投资额
  // 可用保证金/1000*杠杆使用率
  getMin() {
    return this.freeMargin / 1000 * Config.getLever();
  }

  // 最小可用投资金额($)
  // 5元
  getMin2() {
    // return this.freeMargin * 0.05;
    return Config.getStepX();
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
