"use strict";

var Base = require('../../../../app/base');
var PageBase = require('../../../../app/page-base');
var Validate = require('../../../../common/validate');
var Uri = require('../../../../app/uri');
var Cookie = require('../../../../lib/cookie');
var Toast = require('../../../../common/toast');
var Util = require('../../../../app/util');

function RegisterH5() {
  RegisterH5.superclass.constructor.apply(this, arguments);
  var self = this;
  // this.getToken().then(function() {
  self.init();
  // });
}

Base.extend(RegisterH5, PageBase, {
  init: function() {
    this._initValidate();
    this._bind();
    this.configStatistics();

    this._initAttrs();
    this._getWXIconWL();
  },

  _bind: function() {
    var doc = $(document);

    $('.J_Validate').on('change blur', $.proxy(this._change, this));
    $('form').on('submit', $.proxy(this._submit, this));

    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }
  },
  _getWXIconWL: function(){
    $('#wxShare')[0].src=getWXIconWL();
  },

  _change: function(e) {
    var curEl = $(e.currentTarget),
      parent = curEl.parent('.wrapper'),
      validator = this.validator;

    this.curEl = curEl;
    var value = curEl.val();
    var error;

    var submitEl = $('.submit');

    if (curEl.hasClass('tel')) {
      error = validator.validateField({
        name: 'tel',
        display: 'required',
        rules: 'required|callback_tel_number',
        value: value
      });
      if (error) {
        this.showError(parent, error.message);

        return false;
      } else {
        this.hideError(parent);

        return true;
      }
    } else if (curEl.hasClass('password')) {

      error = validator.validateField({
        name: 'repassword',
        rules: 'required|matches[password]',
        value: value
      });

      if (error) {
        this.showError(parent, error.message);

        return false;
      } else {
        this.hideError(parent);


        return true;
      }
    }
  },

  showError: function(wrapperEl, message) {
    var errorEl = $('.err', wrapperEl);

    wrapperEl.addClass('error');

    if (errorEl.length > 0) {
      errorEl.text(message);
      return;
    }

    wrapperEl.append('<div class="err">' + message + '</div>');
  },

  hideError: function(wrapperEl) {
    wrapperEl.removeClass('error');
  },

  _submit: function(e) {
    var self = this,
      submitEl = $('.submit');
    e.preventDefault();
    var valid = true;

    $('.J_Validate').each(function(index, item) {

      if (!self._change({
          currentTarget: $(item)
        })) {
        valid = false;

      }
    });

    if (!valid) {
      return;
    }

    if (!$('.tel').val() || !$('.password').val()) {
      return;
    }

    if (submitEl.hasClass('disable')) {
      return false;
    }

    var password = $('.password').val(),
      phone = $('.tel').val();

    submitEl.val('处理中');
    self.ajax({
      url: '/v1/user/login',
      type: 'post',
      data: {
        phone: phone,
        password: password,
        cc: 86,
        wl: getWXWL()
      },
      noToast: true
    }).then(function(data) {
      data = data.data;

      Cookie.set('token', data.token, {
        expires: Infinity
      });
      Cookie.set('phone', data.phone, {
        expires: Infinity
      });
      Cookie.set('uuid', data.uuid, {
        expires: Infinity
      });
      Cookie.set('inviteCode', data.invite_code, {
        expires: Infinity
      });

      if (!Cookie.get('type')) {
        Cookie.set('type', 'demo', {
          expires: Infinity
        });
      }

      submitEl.val('登录');

      location.href = '../../option.html';

    }, function(data) {
      submitEl.val('登录');

      new Toast('手机号或密码错误');
    });
  },

  _initValidate: function() {
    var self = this;

    var validator = new FormValidator('form', [{
      name: 'tel',
      display: 'required',
      rules: 'required|callback_tel_number'
    }, {
      name: 'password',
      rules: 'required'
    }, {
      name: 'repassword',
      rules: 'required|matches[password]'
    }, {
      name: 'code',
      rules: 'required'
    }], function(errors, e) {
      if (errors.length > 0) {
        e.preventDefault();
        // console.log(errors);
        if ($('.submit').hasClass('disable')) {
          return;
        }
        for (var i = 0, len = errors.length; i < len; i++) {
          var wrapperEl = $(errors[i].element).parent('.wrapper'),
            message = errors[i].message;

          self.showError(wrapperEl, message);
        }
      }
    });

    validator.registerCallback('tel_number', function(value) {
        if (/^(0|86|17951)?(13[0-9]|15[012356789]|18[0-9]|14[57]|17[0123456789])[0-9]{8}$/.test(value)) {
          return true;
        }
        return false;
      })
      .setMessage('tel_number', '请输入正确的手机号码')
      .setMessage('required', '此项为必填项目')
      .setMessage('matches', '两次输入密码不一致');

    this.validator = validator;
  },

  isFromVip: function() {
    var src = new Uri().getParam('src');

    if (src && src.indexOf('vip.html') !== -1) {
      return true;
    }
  },

  _initAttrs: function() {
    $('.recovery').attr('href', '../../recovery-password.html?src=' + encodeURIComponent(location.href));
  },

  attrs: {
    formEl: $('#J_Form')
  }

});

new RegisterH5();