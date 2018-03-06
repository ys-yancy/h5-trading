'use strict';

require('./index.css');
var tmpl = require('./index.ejs');
var Cookie = require('../../../../lib/cookie');

export default class Guide {
  constructor() {

    // 如果r文件设置了不使用新引导流程, 那就不使用
    if (!getUseNewProListGuide() || Cookie.get('new_pro_list_guide') == 1) {
      return;
    }
    this._show();
    Cookie.set('new_pro_list_guide', 1);
  }

  _show() {
    this.el = $(tmpl());

    $('body').append(this.el);

    this.el.on('click', (e) => {
      var curEl = $(e.target);
      this.el.off();
      this.el.remove();
    });

    this.el.on('touchmove', (e) => {
      e.stopPropagation();
      e.preventDefault();
      return false;
    });
  }
}