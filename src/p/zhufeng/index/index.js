"use strict";

require('../../../lib/zepto');
var Header = require('../../../common/header');
var PageBase = require('../../../app/page-base');
var Util = require('../../../app/util');
var Uri = require('../../../app/uri');
var Config = require('../../../app/config');
var Dialog = require('../../../common/dialog');
var tmpl = require('./index.ejs');

class Rigister extends PageBase {
  constructor() {
    super();

    this._bind();
    this.configStatistics();
  }

  _bind() {
    var doc = $(document);

    // doc.on('tap', '.J_Luck', $.proxy(this._luck, this));
    doc.on('tap', '.get-code', $.proxy(this._getCode, this));
    $('form').on('submit', $.proxy(this._submit, this));
    $('.tel').on('change blur', $.proxy(this._check, this));
    $('.code').on('change blur', $.proxy(this._checkCode, this));
    // document.getElementsByTagName('form')[0].onsubmit = $.proxy(this._luck, this);
  }

  _checkCode() {
    var val = $('.code').val();

    if (val) {
      this._hideError($('.wrapper'));
    } else {
      this._showError($('.wrapper'), '验证码不能为空');
    }
  }

  _check(e) {
    var curEl = $(e.currentTarget);

    if (this._validate(curEl.val())) {
      $('.get-code').removeClass('disable');
    } else {
      $('.get-code').addClass('disable');
    }
  }

  _submit(e) {
    e.preventDefault();

    var submitEl = $('.register');

    var telEl = $('.tel');
    // var curEl = $(e.currentTarget);
    var tel = telEl.val().trim();

    var self = this;

    if (!this._validate(tel)) {
      return;
    }

    var code = $('.code').val();

    if (!code) {
      this._showError($('.wrapper'), '请输入验证码');
      return;
    } else {
      this._hideError($('.wrapper'))
    }

    this.referCode = new Uri().getNextPath('i/', 6);
    this.cookie.set('referCode', this.referCode);

    this.ajax({
      url: '/v1/user/create',
      type: 'post',
      data: {
        phone: tel,
        vcode: code,
        cc: 86,
        uuid: Util.guid(),
        nickname: this.getLogin()._generateNickname(),
        refer: this.referCode || '',
        source: this.cookie.get('source'),
        wl: 'etgbroker'
      }
    }).then((data) => {

      Cookie.set('real_token', data.data.real_token, {
        expires: Config.getRealPasswordExpireTime()
      });
      Cookie.set('type', 'real');
      Cookie.set('goType', 'real');

      this.cookie.set('phone', tel, {
        expires: Infinity
      });
      this.cookie.set('token', data.data.token, {
        expires: Infinity
      });
      this.cookie.set('uuid', data.data.uuid, {
        expires: Infinity
      });
      this.cookie.set('inviteCode', data.data.invite_code, {
        expires: Infinity
      });

      submitEl.val('马上注册');

      self.registerErr = false;

      // 如果有邀请人就默认帮用户把红包领了
      if (data.data.refer_code) {
        self._getLottery();
      }
      // 没有邀请人就直接去option
      else {
        self._goRegister();
      }

    }, (data) => {
      self.registerErr = true;
      this.showError(data.message);
      submitEl.val('马上注册');
    });
  }

  _getLottery() {
    var self = this;
    this.ajax({
      url: '/v1/hongbao/use/',
      type: 'post',
      data: {
        access_token: Cookie.get('token')
      }
    }).then(() => {
      self._goRegister();
    });
  }

  _goRegister() {
    if (this.registerErr) {
      return;
    }

    var wl = window.location.pathname.substring(0, window.location.pathname.indexOf('/s/'));

    if (this.isWeixin()) {
      // 直接去option页面
      var url = '?token=' + Cookie.get('token') + '&ri=' + window.location.origin + wl + '/s/option.html?f=g&s=b';
      url = this.weixinUrlFirst + encodeURIComponent(url) + this.weixinUrlLast;
      window.location = url;
    }
    // 直接跳转版本 
    else {
      window.location = window.location.origin + wl + '/s/option.html';
    }
  }

  _validate(tel) {
    var parent = $('.tel').parent();

    if (!tel) {
      this._showError(parent, '请输入手机号码');
      return;
    }

    // 验证手机号，默认是11位  
    if (!/^1[3|4|5|7|8][0-9]\d{8}$/.test(tel)) {
      this._showError(parent, '请输入正确的手机号码');

      return;
    }

    this._hideError(parent);

    return true;
  }

  _countdown(el) {
    var count = 60;

    coundown();
    el.text(count);
    el.addClass('disable');

    function coundown() {
      setTimeout(function() {
        var val = el.val();

        if (val == 0) {
          el.val('重新获取');
          el.removeClass('disable');
        } else {
          val -= 1;
          el.val(val);


          coundown();
        }
      }, 1000);
    }
  }

  _getCode(e) {
    var curEl = $(e.currentTarget),
      tel = $('.tel').val();

    if (!this._validate(tel)) {
      return;
    }

    $('.code')[0].removeAttribute('disabled');

    $('.code').removeAttr('disabled');
    if (curEl.hasClass('disable')) {
      return;
    }

    this._countdown(curEl);

    this.ajax({
      url: '/v1/captcha/' + tel,
      type: 'post',
      data: {
        cc: 86,
        wl: 'etgbroker',
        _r: Math.random()
          //phone: telEl
      }
    }).then(function(data) {

    });
  }


  _showError(wrapperEl, message) {
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

  _hideError(wrapperEl) {
    wrapperEl.removeClass('error').addClass('success');
  }

  showError(msg) {
    this.dialog = new Dialog({
      isShow: true,
      tmpl: this.render(tmpl, {
        msg: msg
      }),
      cancleCallback: function() {
        this.destroy();
      }
    });
  }
}

new Rigister();