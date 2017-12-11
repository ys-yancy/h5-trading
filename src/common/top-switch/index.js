"use strict";

var PageBase = require('../../app/page-base');

class TopSwtich extends PageBase {
  constructor() {
    super();

    this._initAttrs();
    this._bind();
  }

  _bind() {
    var doc = $(document);

    doc.on('click', '.J_Switch', $.proxy(this._switch, this));
  }

  _initAttrs() {
    var isDemo = this.isDemo();

    if (isDemo) {
      $('#J_Switch').text('实盘帐号');
      $('.J_Switch.demo').addClass('active');
      $('.J_Switch.real').removeClass('active');
    } else {
      $('#J_Switch').text('模拟帐号');
      $('.J_Switch.demo').removeClass('active');
      $('.J_Switch.real').addClass('active');
    }
  }

  _switch(e) {
    if (this.isDemo()) {
      this.cookie.set('type', 'real');
    } else {
      this.cookie.set('type', getSimulatePlate() ? 'demo' : 'real');
    }

    location.reload();
  }
}

module.exports = TopSwtich;