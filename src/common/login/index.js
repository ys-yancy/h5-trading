"use strict";

require('./index.css');
var Base = require('../../app/base');
var Cookie = require('../../lib/cookie');
var Config = require('../../app/config');
var Util = require('../../app/util');
var storage = require('../../app/storage');
var Dialog = require('../dialog/index');
var session = require('../../app/session');
var md5 = require('../../lib/md5');
var hasBind = false;

function Login() {
  Login.superclass.constructor.apply(this, arguments);
  this.init();
}

Base.extend(Login, Base, {
  init: function() {
    this._requires();
    this._initAttrs();
    this._bind();
  },

  _bind: function() {
    var doc = $(document);

    if (hasBind) {
      return;
    }

    doc.on('touchstart', $.proxy(this._touch, this));
    doc.on('click', '.J_RecoveryPassword', $.proxy(this._recoveryPassword, this));
    $('.J_DialogMask').on('touchmove', $.proxy(this._preventTouch, this));

    hasBind = true;


    $('#J_SwitchKB').on('click', $.proxy(this._switchKB, this));
    $('#J_TradePassword').on('focus', $.proxy(function() {
      var dialogEl = this.passwordDialog.el;
      $('.message', dialogEl)
        .html('')
        .show();
    }, this));

    this.tradePWD = '';
    $('#J_TradePassword').on('input', $.proxy(this._tradePasswordKeyDown, this));
  },

  _tradePasswordKeyDown: function(e) {
    var el = $('#J_TradePassword')[0];
    // 只有当数字键盘时需要隐藏处理
    if (el.type == 'tel') {
      /*
      // 使用keydown对应的代码
      var k = (e.which) ? e.which : e.keyCode;
      if ( k >= 33 && k <= 126) {
          this.tradePWD +=  String.fromCharCode(k);
          el.value += "*";
          e.preventDefault();
      }
      else if (k == 8) {
          this.tradePWD = this.tradePWD.substring(0, this.tradePWD.length - 1);
      }
      */
      // 使用input对应的代码
      var value = e.target.value;

      // 输入新内容
      if (value.length > this.tradePWD.length) {
        this.tradePWD += value.substr(value.length - 1, 1);
        e.target.value = value.substr(0, value.length - 1) + "*";
      }
      // 删除老内容
      else if (value.length < this.tradePWD.length) {
        this.tradePWD = this.tradePWD.substr(0, this.tradePWD.length - 1);
      }
      // console.log('value=' + e.target.value + ' newTradePWD=' + this.tradePWD);
    }
  },

  _switchKB: function(e) {
    var el = $('#J_TradePassword')[0];
    var tx = $('#J_SwitchKB')[0];
    el.value = '';
    this.tradePWD = '';
    // 当前是数字键盘
    if (el.type == 'tel') {
      el.type = 'password';
      tx.innerHTML = '切换数字键盘输入';
    }
    // 当前是全键盘
    else {
      el.type = 'tel';
      tx.innerHTML = '切换全键盘输入';
    }
  },

  _recoveryPassword: function(e) {
    var curEl = $(e.currentTarget),
      href = curEl.attr('href');

    var curUrl = location.href;

    href += '?&src=' + encodeURIComponent(curUrl);

    curEl.attr('href', href);
  },

  _preventTouch: function(e) {
    e.preventDefault();
  },

  _touch: function(e) {
    clearTimeout(this.timer);
    var realToken;

    this.timer = setTimeout(function() {
      session.set('operation', false);
    }, 60 * 1000);

    realToken = Cookie.get('real_token');

    if (realToken) {
      Cookie.set('real_token', realToken, {
        expires: Config.getRealPasswordExpireTime()
      });
    }
  },

  isExpire: function() {
    var operation = session.get('operation');

    return !operation;
  },

  isFirst: function() {
    return this.passwordFirst;
  },

  _initAttrs: function() {
    session.save({
      operation: true
    });
  },

  isLogin: function(showLogin) {
    var token = Cookie.get('token'),
      phone = Cookie.get('phone');

    if (token && phone) {
      return true;
    }

    if (showLogin) {
      this.showLogin();
    }
  },

  login: function() {
    var d = $.Deferred(),
      self = this;

    if (this.isLogin(true)) {
      d.resolve();
    }

    if (!this.listenLogin) {
      this.on('cancle:login', function() {
        d.reject();
      }, this);
      this.on('success:login', function() {
        d.resolve();
      });
    }

    return d.promise();
  },

  showLogin: function() {
    this._login();
  },

  showSetup: function() {
    this.setupDialog.show();
  },

  showTrade: function(showCancel) {
    if (showCancel) {
      $('#J_DialogSetupCancel').text('取消');
    }
    if(getIsOnlyShowReal()) {
      $('#J_DialogSetupCancel').text('退出登录');
    }
    this.passwordDialog.show();

    $('#J_TradePassword').focus();
  },

  isAnonymous: function() {
    var token = Cookie.get('token'),
      anonymous = storage.get('anonymous');

    return !!token && anonymous === 'true' ? true : false;
  },

  register: function(tel, refer) {
    var nickname = this._generateNickname();
    /**
     * 检查手机号是否注册
     * 注意替换为真实API
     */
    return this.ajax({
      url: '/v1/user/np',
      type: 'post',
      data: {
        phone: tel,
        refer: refer,
        nickname: nickname,
        cc: 86,
        source: Cookie.get('source')
      }
    }).then(function(data) {
      var data = data.data;

      Cookie.set('uuid', data.uuid, {
        expires: Infinity
      });

      Cookie.set('token', data.token, {
        expires: Infinity
      });


      Cookie.set('phone', data.phone, {
        expires: Infinity
      });
    });

  },

  registerAnonymous: function() {
    return this._registerAnonymous();
  },

  _registerAnonymous: function() {
    var self = this,
      uuid = Util.guid(),
      nickname = this._generateNickname(),
      track_id = Cookie.get('invhero_track_id') || '';

    return this.ajax({
      url: '/v1/user/?invhero_track_id=' + track_id,
      type: 'post',
      data: {
        uuid: uuid,
        nickname: nickname,
        source: Cookie.get('source'),
        wl: getWXWL() // refer: self.referCode || Cookie.get('referCode')
      }
    }).then(function(data) {
      if (data && data.data) {

        Cookie.set('token', data.data.token, {
          expires: Infinity
        });
        Cookie.set('uuid', uuid, {
          expires: Infinity
        });
        Cookie.set('type', getSimulatePlate() ? 'demo' : 'real', {
          expires: Infinity
        });
        Cookie.set('inviteCode', data.data.invite_code, {
          expires: Infinity
        });
        storage.set('anonymous', true);

        // 这个调用回不来, 会导致getAccount里面再设置一次昵称
        // self._setNickname();

        return data.data.token;
      }
    });
  },

  _generateNickname: function() {
    var date = new Date();
    var minite = date.getMinutes();
    var second = date.getSeconds();
    var millsecond = date.getMilliseconds();

    var nickname = '壹号金融_' + minite + '' + second + '' + millsecond;

    return nickname;
  },

  _setNickname: function() {
    if (this.nickname) {
      return;
    }

    var self = this;

    var nickname = self._generateNickname();

    this.ajax({
      url: '/v1/user',
      type: 'put',
      data: {
        access_token: Cookie.get('token'),
        nickname: nickname
      }
    }).then(function(data) {
      console.log(data);

      self.nickname = true;
    });

  },
  _login: function() {
    this._hideMessage();
    this.dialog.show();
  },

  _requires: function() {
    var self = this;

    this.dialog = new Dialog({
      isShow: false,
      tmpl: this.tmpl,
      confirmCallback: function() {
        var el = self.dialog.el,
          telEl = $('.tel', el),
          tel = telEl.val(),
          passEl = $('.password', el),
          pass = passEl.val();

        if (!tel) {
          self.showError(telEl.parent('.wrapper'), '手机号不能为空');
          return;
        } else {
          var parent = telEl.parent('.wrapper');
          var regPhone = /^(0|86|17951|d)?(13[0-9]|15[012356789]|18[0-9]|14[57]|17[0-9])[0-9]{8}$/;
          if (!regPhone.test(tel)) {
            self.showError(parent, '请输入正确的手机号');
            return;
          } else {
            self.hideError(parent);
          }
        }

        var passParent = passEl.parent('.wrapper');

        if (!pass) {

          self.showError(passParent, '密码不能为空');
          return;
        } else {
          self.hideError(passParent);
        }

        var curEl = $('.J_DialogConfirm', self.dialog.el);
        self._showLoad(curEl);

        self.ajax({
          url: '/v1/user/login',
          type: 'post',
          data: {
            phone: tel,
            password: pass,
            cc: 86
          }
        }).then(function(data) {
          data = data.data;
          self._hideMessage();
          self.dialog.hide();
          self.broadcast('login:success');
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
          location.reload();

          if (!Cookie.get('type')) {
            Cookie.set('type', 'demo', {
              expires: Infinity
            });
          }

          self.fire('success:login');
          curEl.html('登录');
        }, function(data) {
          // self._showMessage(data.message);
          $('.message', self.dialog.el).html('登录密码错误!').show();
          curEl.html('登录');
        });
      },

      cancleCallback: $.proxy(function() {
        // 只针对首次提醒领红包到达红包页面但取消登录的情况
        if (window.location.pathname.indexOf('lottery') != -1)
          window.location = "./option.html"

        this.fire('cancle:login');
      }, this)
    });

    this.passwordDialog = new Dialog({
      isShow: false,
      tmpl: this.passwordTmpl,
      confirmCallback: $.proxy(this._confirmLogin, this),
      cancleCallback: $.proxy(function() {
        // 如果只显示实盘 关闭对话框则为退出登录
        if(getIsOnlyShowReal() && getWeiXinIsHasReal()) {
          window.location = getLoginWL();
          return;
        }

        // 关闭对话框需要清空状态
        self._clearTradePasswordStatus();
        Cookie.expire('goType');
        self.fire('reject:realToken');
      }, this)
    });

    this.setupDialog = new Dialog({
      isShow: false,
      tmpl: this.setupTmpl,
      confirmCallback: $.proxy(this._setPassword, this),
      cancleCallback: $.proxy(function() {
        Cookie.expire('goType');
        self.fire('reject:realToken');
      }, this)
    });
  },

  // 清空所有交易密码相关状态
  _clearTradePasswordStatus: function() {
    // 本地存储明文交易密码
    this.tradePWD = '';
    // 输入框密文交易密码
    $('#J_TradePassword')[0].value = '';
    // 输入框错误提示
    var dialogEl = this.passwordDialog.el;

    $('.message', dialogEl)
      .html('')
      .show();
  },

  _confirmLogin: function(inputEl) {
    var self = this,
      dialogEl = this.passwordDialog.el,
      password = $('input', dialogEl).val();

    // alert('pwd=' + password + ' newTradePWD=' + this.tradePWD);
    if (!password) {
      $('.message', dialogEl)
        .html('交易密码不能为空!')
        .show();
      return;
    } else {
      // 清空交易密码输入框
      $('input', dialogEl).value = '';

      var el = $('#J_TradePassword')[0];
      // 数字键盘输入数据需要替换
      if (el.type == 'tel') {
        password = this.tradePWD;
      }

      this.ajax({
        url: '/v1/user/real/tradepassword/verify/',
        type: 'post',
        data: {
          access_token: Cookie.get('token'),
          password: md5(password)
        }
      }).then(function(data) {
        self.passwordDialog.hide();
        Cookie.set('type', 'real');

        self._initAttrs();
        self.passwordFirst = false;

        Cookie.set('real_token', data.data.real_token, {
          expires: Config.getRealPasswordExpireTime()
        });
        // self.broadcast('confirm:password');
        self.fire('get:realToken', data.data.real_token);
      }, function() {
        var wl = window.location.pathname.substring(0, window.location.pathname.indexOf('/s/'));

        var t = '交易密码错误! <a href="' + window.location.origin + wl + '/s/recovery-trade-password.html?src=' + encodeURIComponent(window.location.href) + '">点此重置><a>';

        $('.message', dialogEl)
          .html(t)
          .show();
      });
    }
  },

  _setPassword: function() {
    var self = this,
      dialogEl = this.setupDialog.el,
      firstVal = $('.first', dialogEl).val(),
      secondVal = $('.second', dialogEl).val(),
      messageEl = $('.message', dialogEl);

    if (!firstVal || !secondVal) {
      messageEl
        .html('密码不能为空')
        .show();
      return;
    } else if (firstVal !== secondVal) {
      messageEl
        .html('两次输入密码不一致')
        .show();
      return;
    } else {
      var curEl = $('.J_DialogConfirm', this.setupDialog.el);
      this._showLoad(curEl);

      this.ajax({
        url: '/v1/user/real/tradepassword',
        type: 'post',
        data: {
          access_token: Cookie.get('token'),
          password: md5(firstVal)
        }
      }).then(function(data) {
        self.setupDialog.hide();
        self._initAttrs();
        self.passwordFirst = false;
        Cookie.set('real_token', data.data.real_token, {
          expires: Config.getRealPasswordExpireTime()
        });

        self.fire('get:realToken', data.data.real_token);
        curEl.html('设定');
      }, function() {
        curEl.html('设定');
      });

    }
  },

  showError: function(wrapperEl, message) {
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

  },

  hideError: function(wrapperEl) {
    wrapperEl.removeClass('error').addClass('success');

  },

  _hideMessage: function() {
    var el = this.dialog.el,
      messageEl = $('.J_Message', el);

    messageEl.hide();
  },

  _showMessage: function(message) {
    var el = this.dialog.el,
      messageEl = $('.J_Message', el);

    messageEl.show().html(message);
  },

  attrs: {
    passwordFirst: true,

    tmpl: [
      '<div class="dialog J_Dialog dialog-login" id="J_Dialog">',
      '   <div class="dialog-title">登录</div>',
      '   <span class="close-wrapper J_DialogClose">',
      '       <span class="dialog-close icon"></span>',
      '   </span>',
      '   <div class="dialog-content J_Content">',
      '       <div class="wrapper">',
      '        <input class="tel" type="text" placeholder="请输入手机号" >',
      '        <span class="icon phone"></span>',
      '       </div>',
      '       <div class="wrapper">',
      '        <input class="password" type="password" placeholder="请输入登录密码">',
      '        <span class="icon lock"></span>',
      '       </div>',
      '   </div>',
      '   <div class="dialog-buttons clearfix">',
      '       <p class="J_Message message"></p>',
      '       <span id="et_login_cancel" class="dialog-btn J_DialogClose" data-idx="alert0">取消</span>',
      '       <span id="et_login_login" class="dialog-btn J_DialogConfirm" data-idx="alert0">登录</span>',
      '       <a class="guide" id="J_GoRegister" href="./register.html?src=' + encodeURIComponent(location.href) + '">没有帐号？立即注册</a>',
      '       <a class="forget J_RecoveryPassword" id="J_GoGetPassWord" href="./recovery-password.html">忘记密码？</a>',
      '   </div>',
      '</div>',
      '<div class="dialog-mask J_DialogMask"></div>'
    ].join(''),

    passwordTmpl: [
      '<div class="dialog J_Dialog password-dialog " id="J_Dialog">',
      '   <div class="dialog-content J_Content">',
      '       <p class="title">为保证您的实盘账户资金安全,请输入交易密码</p>',
      '       <div class="input-wrapper">',
      '           <input id="J_TradePassword" type="tel" placeholder="请输入交易密码">',
      '       </div>',
      '   </div>',
      '   <div class="dialog-buttons clearfix">',
      '       <span class="dialog-btn J_DialogClose" id="J_DialogSetupCancel">取消</span>',
      '       <span class="dialog-btn J_DialogConfirm">确认</span>',
      '   </div>',
      '</div>',
      '<div class="dialog-mask J_DialogMask"></div>'
    ].join(''),

    setupTmpl: [
      '<div class="dialog J_Dialog setup-dialog " id="J_Dialog">',
      '   <span class="wrapper-icon"><span class="icon"></span></span>',
      '   <div class="dialog-content J_Content">',
      '       <p class="title">为保证您的实盘账户资金安全，</p>',
      '       <p class="title">请设置交易密码并妥善保存</p>',
      '       <div class="input-wrapper">',
      '           <input type="password" class="first" placeholder="请输入交易密码">',
      '           <input type="password" class="second" placeholder="请再次输入交易密码">',
      '       </div>',
      '       <p class="message">实盘交易密码错误!</p>',
      '   </div>',
      '   <div class="dialog-buttons clearfix">',
      '       <span class="dialog-btn J_DialogClose">取消</span>',
      '       <span class="dialog-btn J_DialogConfirm">设定</span>',
      '   </div>',
      '</div>',
      '<div class="dialog-mask J_DialogMask"></div>'
    ].join('')
  },

  _showLoad: function(curEl) {
    this.loadEl = curEl;
    curEl.append('<div class="loading-wrapper"><span>处理中<span class="dialog-load"></span></span></div>')
  },

  _hideLoad: function() {
    $('.loading-wrapper', this.loadEl).remove();
  },
});

module.exports = Login;