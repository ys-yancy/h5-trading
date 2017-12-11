'use strict';

var tmpl = require('./index.ejs');
var resultTmpl = require('./result.ejs');
var wxresultTmpl = require('./wxresult.ejs');
var Cookie = require('../../../lib/cookie');
var Util = require('../../../app/util');

export default class Guide {
  constructor() {

    // 如果r文件设置了不使用新引导流程, 那就不使用
    if (!getUseNewGuide() || Cookie.get('new') == 2) {
      return;
    }
    this._show();
    Cookie.set('new', 2);
  }

  _show() {
    this.el = $(tmpl());

    $('body').append(this.el);

    this.el.on('click', (e) => {
      var curEl = $(e.target);



      if (curEl.hasClass('inner') || curEl.parents('.inner').length !== 0) {

      } else {
        this.el.remove();
      }
    });
  }

  showResult() {

    // 移除前一个页面的弹出层
    if (this.el) {
      this.el.remove();
    }

    // 如果r文件设置了不使用新引导流程, 那就不使用
    if (!getUseNewGuide()) {
      return;
    }
    if (this.hasShow) {
      return;
    }

    // if (Cookie.get('new') == 2) {
    //   return;
    // }

    Cookie.set('new', 2);

    this.hasShow = true;
    if (Util.isWeixin() && getWXIDWL()) {
      this.el = $(wxresultTmpl());
    }
    else {
      this.el = $(resultTmpl());
    }

    $('body').append(this.el);

    this.el.on('click', (e) => {
      var curEl = $(e.target);



      if (curEl.hasClass('inner-1') || curEl.parents('.inner-1').length !== 0) {

      } else {
        this.el.remove();
      }
    })
  }
}