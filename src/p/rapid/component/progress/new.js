'use strict';

var Base = require('../../../../app/base');
var Config = require('../../../../app/config');
var Toast = require('../../../../common/toast');
var CountP = require('./progress');
var N = Config.getStep();

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

    // progress.option.defaultMon = defaultCon;
    // progress.init();
  }

  setVal(p) {
    progress.option.stopDraw = false;
    progress.reDraw(p);
  }

  getProgress(val) {
    this.countP._progress(val);

    progress.option.dMaxMoney = this.countP.getMax2();
    progress.reDraw(parseInt($('#money').val(), 5));
  }

  investNum() {
    return this.countP.investNum;
  }

  getParams2(a, b, c) {
    return this.countP.getParams2(a, b, c);
  }

}