'use strict';

var Base = require('../../../../app/base');
var Config = require('../../../../app/config');
var Toast = require('../../../../common/toast');
var CountP = require('./progress');
var N = Config.getStep();
var Slider = require('../../../../common/range-slider/new.js');
export default class Progress extends Base {
  constructor(config) {
    super();

    this.countP = new CountP({
      parent: this,
      freeMargin: config.netDeposit,
    });

    var defaultCon = Config.getRapidDefaultInv();
    var max = this.countP.getMax2();
    var min = this.countP.getMin2();
    var per = (defaultCon - min) / (max - min);

    this.countP._progress(per);
    this.initSingleSlider(defaultCon, config.netDeposit)
  }

  initSingleSlider(defaultCon, netDeposit) {
    netDeposit = parseInt(netDeposit);
    this.slider = new Slider({
      el: $('.single-slider'),
      valEl: $('#money'),
      defaultVal: defaultCon,
      config: {
        to: netDeposit,
        step: N
      }
    })
  }

  setVal(p) {
    this.slider.setVal(p);
  }

  investNum() {
    return this.countP.investNum;
  }

  getParams2(a, b, c) {
    return this.countP.getParams2(a, b, c);
  }

}