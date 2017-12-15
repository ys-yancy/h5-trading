'use strict';

var Base = require('../../../../app/base');
var Config = require('../../../../app/config');
var Toast = require('../../../../common/toast');
var CountP = require('./progress');
var N = Config.getStep();
require('./range.js');
export default class Progress extends Base {
  constructor(config) {
    super();

    this.countP = new CountP({
      parent: this,
      freeMargin: 17765 //config.freeMargin,
    });

    var defaultCon = Config.getRapidDefaultInv();
    var max = this.countP.getMax2();
    var min = this.countP.getMin2();
    var per = (defaultCon - min) / (max - min);



    this.countP._progress(per);
    this.initSingleSlider(defaultCon)
  }

  initSingleSlider(defaultCon) {
    $('.single-slider').jRange({
      from: 0,
      to: 1000,
      step: 5,
      width: '12rem',
      showLabels: false,
      showScale: false,
      onstatechange: this.setVal
    });

    $('.single-slider').jRange('setValue', 500);
  }

  setVal(p) {
   console.log(p)
  }

  investNum() {
    return this.countP.investNum;
  }

  getParams2(a, b, c) {
    return this.countP.getParams2(a, b, c);
  }

}