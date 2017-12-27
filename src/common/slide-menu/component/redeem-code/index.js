'use strict';

require('./index.css');
var Base = require('../../../../app/base');
var Dialog = require('../../../../common/dialog');
var Cookie = require('../../../../lib/cookie');
var Toast = require('../../../../common/toast');
var redemptionTmpl = require('./index.ejs');

export default class RedeemCode extends Base {
  constructor(config) {
    super(config);

    this._bind();

    this.checkRe = false;
    this.onlyOne = true;
  }

  _bind() {
    var doc = $(document);

    doc.on('tap', '.J_ShowRedeemCode', $.proxy(this.showDialog, this));

    // this.subscribe('get:myaccount', (e) => {
    //   if (e.refer_code) {
    //     $('.invite-item', this.el).hide();
    //   }
    // });
  }

  showDialog() {
    this.dialog = new Dialog({
      isShow: true,
      tmpl: this.render(redemptionTmpl, {
        type: 'init'
      }),
      confirmCallback: () => {
        this.checkRedemption();
      },
      cancleCallback: function() {
        this.destroy();
      }
    });
    setTimeout(() => {
      $('input', this.dialog.el).focus();
    }, 300);
  }

  checkRedemption() {
    var iptEl = $('#J_RedemptionIpt');
    var val = iptEl.val();
    var parentEl = iptEl.parent();
    var self = this;

    if (!val) {
      this.showError(parentEl, '请输入兑换码！');
      return;
    } else {
      this.hideError(parentEl)
    }
    if (this.checkRe) {
      return;
    }

    this.checkRe = true;
    if(this.onlyOne){
      this.onlyOne = false;
      this.ajax({
      url: '/v1/user/promocode/',
      data: {
        access_token: Cookie.get('token'),
        code: val
      },
      type: 'post'
      }).then((data) => {
        self.onlyOne = true;
        data = data.data;
  
        this.dialog.destroy();
        self.checkRe = false;
        new Toast('兑换成功');
        console.log(data);
      }, (data) => {
        self.onlyOne = true;
        var message = data.message || '请输入正确的兑换码';
        this.showError(parentEl, message);
        self.checkRe = false;
      });
    }
  }

  showError(wrapperEl, message) {
    var errorEl = $('.error', wrapperEl);
    wrapperEl.addClass('error').removeClass('success');
    if (errorEl.length > 0) {
      var msgEl = $('p', wrapperEl).text(message);
      return;
    }
    var html = [
      '<div class="error">',
      '   <span class="icon"></span>',
      '   <p>' + message + '</p>',
      '</div>'
    ].join('');

    wrapperEl.append(html);
  }

  hideError(wrapperEl) {
    wrapperEl.removeClass('error').addClass('success');
  }
}