'use strict';

var PageBase = require('../../../../app/page-base');
var Util = require('../../../../app/util');
var Uri = require('../../../../app/uri');
var Validate = require('../../../../common/validate');
var Config = require('../../../../app/config');
var Dialog = require('../../../../common/dialog');
var Cookie = require('../../../../lib/cookie');
require('../responsive');
var ImageCaptcha = require('../../../../common/image-captcha');

class Register extends PageBase {
  constructor() {
    super();
    this._initAttrs();
    this._requires();
    this._setSource();
    this._initValidate();

    this._bind();
    this.configStatistics();
    this._getWXIconWL();
  }

  _bind() {

    var doc = $(document);

    doc.on('tap', '.get-code', $.proxy(this._getCode, this));
    doc.on('tap', '.get-captcha', $.proxy(this._getCode, this));
    $('.J_Validate').on('change blur', $.proxy(this._change, this));

    $('#J_Form').on('submit', $.proxy(function(e) {
      var curEl = $(e.currentTarget),
        telEl = $('.tel', curEl),
        tel = telEl.val();
      e.preventDefault();

      this._submit(tel);

    }, this));

    if (this.isWeixin()) {
      this.setupWeiXinShare('origin_share');
    }
  }
  _getWXIconWL(){
    $('#wxShare')[0].src=getWXIconWL();
  }

  _submit(tel) {
    var dialog = this.dialog,
      self = this;
    var submitEl = $('.submit');

    $('.J_Validate').each(function(index, item) {
     
      self._change({
        currentTarget: $(item)
      });
    });

    if (!$('.code').val() /*|| !$('.name').val()*/) {
      return;
    }

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
        vcode: $('.code').val(),
        cc: 86,
        uuid: Util.guid(),
        nickname: self._generateNickname()/*$('.name').val()*/,
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
      if (self.referCode) {
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

  _getLottery() {
    var self = this;
    this.ajax({
      url: '/v1/hongbao/use/',
      type: 'post',
      data: {
        access_token: Cookie.get('token')
      }
    }).then(() => {
      this._goRegister();
    });
  }

  _goRegister() {
    if (!this.registerPhone || this.registerErr) {
      return;
    }

    var wl = window.location.pathname.substring(0, window.location.pathname.indexOf('/s/'));

    if (this.isWeixin()) {
      // 直接去option页面
      var url = '?token=' + Cookie.get('token') + '&wl=' + getWXWL() + '&ri=' + window.location.origin + wl + '/s/option.html?f=g&s=b';
      url = this.weixinUrlFirst + encodeURIComponent(url) + this.weixinUrlLast;
      window.location = url;
    }
    // 直接跳转版本 
    else {
      window.location = window.location.origin + wl + '/s/option.html';
    }
  }

  _change(e) {
    var curEl = $(e.currentTarget),
      parent = curEl.parent('.wrapper'),
      validator = this.validator;

    this.curEl = curEl;
    var value = curEl.val();
    var error;
    var getCodeEl = $('.get-code');
    var submitEl = $('.submit');

    // this.formEl.submit();
    // return;

    if (curEl.hasClass('tel')) {
      error = validator.validateField({
        name: 'tel',
        display: 'required',
        rules: 'required|callback_tel_number',
        value: value
      });
      if (error) {
        this.showError(parent, error.message);
        getCodeEl.addClass('disable');
      } else {
        this.hideError(parent);
        getCodeEl.removeClass('disable');
      }
    } else if (curEl.hasClass('code')) {
      error = validator.validateField({
        name: 'code',
        rules: 'required',
        value: value
      });

      if (error) {
        this.showError(parent, error.message);
      } else {
        this.hideError(parent);
      }
    }
    /* 
    else if (curEl.hasClass('name')) {
      error = validator.validateField({
        name: 'name',
        rules: 'required',
        value: value
      });

      if (error) {
        this.showError(parent, error.message);
      } else {
        this.hideError(parent);
      }
    }
    */

    var disable = false;

    $('.wrapper', '#J_Form').each(function(index, item) {
      item = $(item);
      if (!item.hasClass('submit-wrapper')) {
        if (!$(item).hasClass('success')) {
          disable = true;
        }
      }
    });

    if (disable) {
      submitEl.addClass('disable');
    } else {
      submitEl.removeClass('disable');
    }

  }

  _getCode(e) {
    var tel = $('.tel').val(),
      curEl = $(e.currentTarget);
    if (curEl.hasClass('get-code')) {
      if (!this._validate(tel)) {
        return;
      }
  
      $('.code').removeAttr('disabled');
      if (curEl.hasClass('disable')) {
        return;
      }
      this.imageCap._show();
$('.captcha-text').focus();
    }
    if (curEl.hasClass('get-captcha')) {
      var captInput = $('#J_ImageCaptcha .captcha-text' );
      if (captInput.val().length!==4){
        $('#captcha-message').html('验证码错误!');
        $('#J_ImageCaptcha .captcha-text').val('');
        this.imageCap._show();
$('.captcha-text').focus();
      }else{
        var _this=this;
        curEl.addClass('disable');
        this.ajax({
            url: '/v1/captcha/' + tel,
            type: 'post',
            data: {
                cc: 86,
                captcha: $('#J_ImageCaptcha .captcha-text' ).val(),
                wl: getWXWL(),
                _r: Math.random()
                    //phone: telEl
            }
        }).then(function(data) { 
          if(data.data==="image_vcode error"){
            $('#captcha-message').html('验证码错误!');
            $('#J_ImageCaptcha .captcha-text').val('');
            _this.imageCap._show();
$('.captcha-text').focus();
            curEl.removeClass('disable');
          }else{
            $('#captcha-message').html('短信已发送!');
            curEl.addClass('disable');
            $('.code').removeAttr('disabled');
            setTimeout(function(){
              $('#get-captcha').removeClass('disable');
              _this.imageCap._hide();
              _this._countdown($('.get-code'));
            }, 1000);
          }
            //$('#captcha-message').html('短信已发送!');
            //curEl.addClass('disable');
            //$('.code').removeAttr('disabled');
            //setTimeout(function(){
            //  $('#get-captcha').removeClass('disable');
            //  _this.imageCap._hide();
            //  _this._countdown($('.get-code'));
            //}, 1000);
        }).fail(function(data){
            $('#captcha-message').html('验证码错误!');
            $('#J_ImageCaptcha .captcha-text').val('');
            _this.imageCap._show();
$('.captcha-text').focus();
            curEl.removeClass('disable');
        });
      }
    }   
  }

  _countdown(el) {
    var count = 60;

    coundown();
    el.text(count);
    el.addClass('disable');

    function coundown() {
      setTimeout(function() {
        var val = el.text();

        if (val == 0) {
          el.text('重新获取');
          el.removeClass('disable');
        } else {
          val -= 1;
          el.text(val);


          coundown();
        }
      }, 1000);
    }
  }

  _validate(tel) {
    var parent = $('.tel').parent();

    if (!tel) {
      this.showError(parent, '请输入手机号码');
      return;
    }

    // 验证手机号，默认是11位  
    if (!/^1[3|4|5|7|8][0-9]\d{8}$/.test(tel)) {
      this.showError(parent, '请输入正确的手机号码');

      return;
    }

    this.hideError(parent);

    return true;
  }

  _initValidate() {
    var self = this;

    var validator = new FormValidator('J_Form', [{
      name: 'tel',
      display: 'required',
      rules: 'required|callback_tel_number'
    }, /*{
      name: 'name',
      rules: 'required'
    }, */
    {
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
        if (/((\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$)/.test(value)) {
          return true;
        }
        return false;
      })
      .setMessage('tel_number', '请输入正确的手机号码')
      .setMessage('required', '此项为必填项目');

    this.validator = validator;
  }

  showError(wrapperEl, message) {
    var errorEl = $('.err', wrapperEl);

    wrapperEl.addClass('error');

    if (errorEl.length > 0) {
      errorEl.text(message);
      return;
    }

    wrapperEl.append('<div class="err">' + message + '</div>');
  }

  hideError(wrapperEl) {
    wrapperEl.removeClass('error');
  }

  _generateNickname() {
        var date = new Date();
        var minite = date.getMinutes();
        var second = date.getSeconds();
        var millsecond = date.getMilliseconds();

        var nickname = getDefaultNicknamePrefix() + minite + '' + second + '' + millsecond;

        return nickname;
  }

  _initAttrs() {
    var params = new Uri().getParams();
    /*
     * kind: 
     *    dl: 只显示下载入口
     *    n: 普通流程, 显示直接去option的入口
     */

    this.kind = params.kind;
    this.referCode = new Uri().getNextPath('/i/', 6);
    if(!this.referCode){
      this.referCode=params.referCode;
      if(!this.referCode) {
        this.referCode = Cookie.get('referCode');
      }
      Cookie.set('referCode', this.referCode);
    }

    // 注册红包金额
    this.hb_amount = params.hb ? params.hb : 15;
  }

  _requires() {
    this.imageCap = new ImageCaptcha();
    this.dialog = new Dialog({
      isShow: false,
      tmpl: ['<div class="dialog-ios8 J_Dialog" id="J_Dialog">',
        '   <div class="dialog-title-ios8">提示</div>',
        '   <div class="dialog-content-ios8 J_Content"><%= data.content %></div>',
        '   <div class="dialog-buttons-ios8">',
        '       <span class="dialog-btn J_DialogClose" data-idx="alert0">知道了</span>',
        '   </div>',
        '</div>',
        '<div class="dialog-mask J_DialogMask"></div>'
      ].join(''),
      cancleCallback: $.proxy(function() {
        this._goRegister();
        this.confirm = true;
      }, this)
    })
  }

  _setSource() {
    var params = new Uri().getParams();
    // 记录用户来源, 优先取微信的from, 其次是我们自己定的source
    this.source = params.from ? params.from : params.source;
    if (!Cookie.get('source') && this.source) {
      Cookie.set('source', this.source);
    }

  }
}

new Register();