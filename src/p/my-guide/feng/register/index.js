'use strict';

var PageBase = require('../../../../app/page-base');
var Toast = require('../../../../common/toast');
var Core = require('../../../my/common/core');
var Config = require('../../../../app/config');
var Uri = require('../../../../app/uri');
var Util = require('../../../../app/util');
var ImageCaptcha = require('../../../../common/image-captcha');

export default class Guides extends PageBase {
  constructor() {
    super();
    
    this._bind();
    this.configStatistics();

    this.imageCap = new ImageCaptcha();
    this.imageCap._changeClass('guides');

    var ph = 'tel:' + getSPhone();
    
      // 设置链接
    $('.J_SPhone').attr('href', ph);
      // 设置text
    $('.J_SPhone').text(getSPhone());


    var params = new Uri().getParams();
    this.inviteCode = params.inviteCode;

    // 记录用户来源, 优先取微信的from, 其次是我们自己定的source
    this.source = params.from ? params.from : params.source;
    if (!this.cookie.get('source') && this.source) {
      this.cookie.set('source', this.source);
    }

    if (!this.inviteCode) {
      // 从r文件取注册赠金数据
      $('.num').text('$ ' + getRegBonus());
    } else {
      // $('.J_Next').attr('href', $('.J_Next')[0].pathname + '?inviteCode=' + this.inviteCode);

      // 登录链接需要加inviteCode
      // $('.J_Login').attr('href', $('.J_Login')[0].pathname + '?inviteCode=' + this.inviteCode);

      this.core = new Core({ inviteCode: this.inviteCode });

      this.core.getInfo().then((data) => {

        $('.name').text(data.nick_name);
        data.avatar = data.avatar ? Config.getAvatarPrefix(data.avatar) : getDefaultIconWL();
        $('.J_Avatar').attr('src', data.avatar);

        // 从r文件取赠金数据
        $('.num').text('$ ' + (getRegBonus() + getInviteRegBonus()));
      });
    }

  }

  _bind() {
    var doc = $(document);

    $('.J_Register').on('click', function(e) {
      $('#J_Popup').show();
    });
    /*
    $('.J_Close').on('click', function(e) {
      $('#J_Popup').hide();
    });
    */

    $('.J_Phone').on('change blur', (e) => {
      this._validate();
    });

    $('.get-code').on('tap', $.proxy(this._getCode, this));
    $('.J_Submit').on('click', $.proxy(this._submit, this));
    doc.on('tap', '.get-captcha', $.proxy(this._getCode, this));

    if (this.isWeixin()) {
      this.setupWeiXinShare('origin_share');
    }
  }

  _validate() {
    var message;
    var phoneEl = $('.J_Phone');
    var tel = phoneEl.val();
    var parent = phoneEl.parent();

    if (!tel) {
      message = '请输入手机号码';

      this.showError(parent, message);

      return false;
    }
    // 验证手机号，默认是11位  
    else if (!/^1[3|4|5|7|8][0-9]\d{8}$/.test(tel)) {
      this.showError(parent, '请输入正确的手机号码');

      return false;
    }
    else {

      this.hideError(parent);

      $('.J_GetCode').removeClass('disable');

      return true;
    }
  }

  _validateCode() {
    var codeEl = $('.J_Code'),
      code = codeEl.val(),
      parent = codeEl.parent();

    if (!code) {
      this.showError(parent, '请输入验证码');
      return false;
    }
    else {
      this.hideError(parent);
      return true;
    }
  }

  _getCode(e) {
    var telEl = $('.phone').val(),
      curEl = $(e.currentTarget);
    if (curEl.hasClass('get-code')) {
      $('.code').removeAttr('disabled');
      if (curEl.hasClass('disable')) {
        return;
      }
  
      if (!this._validate()) {
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
            url: '/v1/captcha/' + telEl,
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

  _submit(e) {
    var self = this,
      submitEl = $('.submit');

    if (submitEl.hasClass('disable')) {
      return false;
    }

    if (!this._validate() || !this._validateCode()) {
      return false;
    }

    var phone = $('.phone').val(),
      cc = 86,
      vcode = $('.code').val(),
      token = this.cookie.get('token');

    submitEl.val('处理中');

    // var from = new Uri().getParam('from');
    this.ajax({
      url: '/v1/user/create',
      type: 'post',
      data: {
        phone: phone,
        vcode: vcode,
        cc: 86,
        uuid: Util.guid(),
        nickname: self._generateNickname(),
        refer: self.inviteCode,
        source: this.cookie.get('source'),
        wl: getWXWL()
      }
    }).then(function(data) {

      Cookie.set('real_token', data.data.real_token, {
        expires: Config.getRealPasswordExpireTime()
      });
      Cookie.set('type', 'real');
      Cookie.set('goType', 'real');

      Cookie.set('phone', phone, {
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

      // 如果有邀请人就默认帮用户把红包领了
      if (data.data.refer_code) {
        var sself = self;
        self.ajax({
            url: '/v1/hongbao/use/',
            type: 'post',
            data: {
                access_token: Cookie.get('token')
            }
        }).then(() => {
            sself.finishRegister();
        });
      }
      // 没有邀请人就直接去option
      else {
        self.finishRegister();
      }

      

    }, function(data) {
      var parent = submitEl.parent('.wrapper');
      self.showError(parent, data.message);
      submitEl.val('立即注册 领取赠金');
    });
  }

  _generateNickname() {
        var date = new Date();
        var minite = date.getMinutes();
        var second = date.getSeconds();
        var millsecond = date.getMilliseconds();

        var nickname = getDefaultNicknamePrefix() + minite + '' + second + '' + millsecond;
        
        return nickname;
  }

  finishRegister() {
    var popupEl = $('#J_Popup');

    $('.form', popupEl).hide();

    // 微信里需要增加 关注微信入口
    if (this.isWeixin()) {
      var wx = '<a href="https://mp.weixin.qq.com/mp/profile_ext?action=home&scene=110&__biz=' + getWXIDWL() +'#wechat_redirect">关注微信再领 5 美元</a>'
      var aa = $('.success-wrapper .btn-wrapper a');
      aa.addClass('btm');
      aa.parent().prepend(wx);
    }

    $('.success-wrapper', popupEl).show();

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

new Guides();