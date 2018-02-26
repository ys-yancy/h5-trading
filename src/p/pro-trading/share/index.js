'use strict';

require('./index.css');

var tmpl = require('./index.ejs');
var PageBase = require('../../../app/page-base');


export default class Share extends PageBase {
  constructor(config) {
    super(config);

    // $('.wrapper-share-money').remove();

    if (this.isDemo()) {
      return;
    }

    this._bind();
  }

  getInfo() {
    this._render(true).then((result) => {
      this._reBind();

      this.hasCheck = true;
    });
  }

  _bind() {
    window._getReward = $.proxy(this._getReward, this);

    window.shareSuccess = () => {

      if(this.isDemo()) {
        return;
      }

      this._render(false).then((data) => {
        return data.rewarded == 0 && this._getReward();
      });
    };
  }

  _reBind() {
    this.el.on('click', (e) => {
      var curEl = $(e.target);
      if (curEl.parents('.outer').length !== 0) {
        return;
      }
      e.stopPropagation();
      this.el.remove();
    });

    $('.outer', this.el).on('click', (e) => {
      e.stopPropagation();
    });
  }

  _render(showGuide) {
    // if (this.type === 'order') {
    return this.ajax({
      url: '/v1/order/share/reward/info',
      type: 'get',
      data: {
        access_token: this.cookie.get('token'),
        ticket: this.ticket,
        invite: this.cookie.get('inviteCode')
      }
    }).then((data) => {
      // if (data.data.rewarded >= 1) {
        // this.el && this.el.remove();
        // this.el = this.renderTo(tmpl, {
        //   result: true,
        //   amount: data.data.amount,
        //   type: 'order'
        // }, $('body'));
        // this._reBind();
      // } else {
        // if (showGuide) {
          // this.el && this.el.remove();
          // this.el = this.renderTo(tmpl, { result: false }, $('body'));
          // this._reBind();
        // }
      // }

      return data.data;
    });
    // } else {
    //   this.el = this.renderTo(tmpl, { result: false }, $('body'));
    //   next();
    // }
  }

  _getReward() {
    this.ajax({
      url: '/v1/order/share/reward',
      type: 'post',
      data: {
        access_token: this.cookie.get('token'),
        ticket: this.ticket,
        invite: this.cookie.get('inviteCode')
      }
    }).then((data) => {
      // alert(JSON.stringify(data));
      // this.el && this.el.remove();
      // this.el = this.renderTo(tmpl, { result: true, amount: data.data.amount }, $('body'));
      // this._reBind();
    });
  }
}