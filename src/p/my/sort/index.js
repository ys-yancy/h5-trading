'use strict';

var PageBase = require('../../../app/page-base');

export default class Guides extends PageBase {
  constructor() {
    super();
    this.configStatistics();
  }


  _bind() {
    var doc = $(document);

    $('.J_Register').on('click', function(e) {
      $('#J_Popup').show();
    });

    doc.on('tap', '.J_Close', function(e) {
      $('#J_Popup').hide();
    });



    doc.on('tap', '.register', $.proxy(this._register, this));
    doc.on('tap', '.J_GetCode', $.proxy(this._getCode, this));

    $('.action-wrapper').on('submit', $.proxy(function(e) {
      var curEl = $(e.currentTarget),
        telEl = $('.tel', curEl),
        tel = telEl.val();
      e.preventDefault();

      this._submit(tel);

    }, this));

    $('.tel').on('focus', $.proxy(this._scrollIntoView, this));

    if (this.isWeixin()) {
      this.setupWeiXinShare('origin_share');
    }

    

  }

  _getCode(e) {
    var curEl = $(e.currentTarget),
      parent = curEl.parent('.wrapper').parent('.form'),
      tel = $('.J_Phone', parent).val();

    if (!this._validate(tel)) {
      return;
    }

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
        wl: getWXWL(),
        _r: Math.random()
          //phone: telEl
      }
    }).then(function(data) {

    });
  }

  _countdown(el) {
    var count = 60;

    coundown();
    el.val(count);
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



  _register(e) {
    var curEl = $(e.currentTarget),
      parent = curEl.parent('.action-wrapper'),
      telEl = $('.tel', parent),
      codeEl = $('.code', parent),
      tel = telEl.val(),
      code = codeEl.val();

    if (!code) {
      var dialog = this.dialog;

      dialog.setContent('请输入验证码');
      dialog.show();
      return;
    }

    this._submit(tel, curEl, code);
  }

  _validate(tel) {
    var phoneEl = $('.J_Phone'),
      parent = parentEl.parent();

    if (!tel) {
      dialog.setContent('请输入手机号码');
      dialog.show();
      return;
    }

    // 验证手机号，默认是11位  
    if (!/^1[3|4|5|7|8][0-9]\d{8}$/.test(tel)) {
      dialog.setContent('请输入正确的手机号码');
      dialog.show();
      return;
    }

    return true;
  }

  _submit(tel, submitEl, code) {
    var dialog = this.dialog,
      self = this;

    if (!this._validate(tel)) {
      return;
    }


    dialog.setContent('您已注册成功，登录密码已发送至您的手机，请注意查收。');
    dialog.show();
    self.registerPhone = true;

    submitEl.val('处理中');

    // 默认提供交易密码
    this.ajax({
      url: '/v1/user/create',
      type: 'post',
      data: {
        phone: tel,
        vcode: code,
        cc: 86,
        uuid: Util.guid(),
        nickname: self.login._generateNickname(),
        refer: self.referCode,
        source: Cookie.get('source'),
        wl: getWXWL()
      }
    }).then(function(data) {

      Cookie.set('real_token', data.data.real_token, {
        expires: Config.getRealPasswordExpireTime()
      });
      Cookie.set('type', 'real');
      Cookie.set('goType', 'real');

      Cookie.set('phone', tel, {
        expires: Infinity
      });
      Cookie.set('token', data.data.token, {
        expires: Infinity
      });
      Cookie.set('uuid', data.data.uuid, {
        expires: Infinity
      });
      Cookie.set('inviteCode', data.data.invite_code, {
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
    }, function(data) {
      self.registerErr = true;
      var dialog = self.dialog;

      dialog.setContent(data.message);
      dialog.show();
      submitEl.val('马上注册');
    });
  }
}

new Guides();