'use strict';

var PageBase = require('../../../app/page-base');
var Toast = require('../../../common/toast');
var Core = require('../common/core');
var Config = require('../../../app/config');
var Uri = require('../../../app/uri');
var Util = require('../../../app/util');
var ImageCaptcha = require('../../../common/image-captcha');

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
    
    this.inviteCode = params.referCode || params.inviteCode || this.cookie.get('recordInviteCode');

    // 记录用户来源, 优先取微信的from, 其次是我们自己定的source
    this.source = params.from ? params.from : params.source;
    if (!this.cookie.get('source') && this.source) {
      this.cookie.set('source', this.source);
    }

    if (!this.inviteCode) {
      // 从r文件取注册赠金数据
      $('.num').text('$ ' + getRegBonus());
    } else {
      this.cookie.set('recordInviteCode',this.inviteCode);
      $('.J_Next').attr('href', $('.J_Next')[0].pathname + '?inviteCode=' + this.inviteCode);

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
    this._slideVerify();
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

    $('.J_Password').on('change blur', () => {
      this._validatePasswrod();
    })

    $('.get-code').on('tap', $.proxy(this._getCode, this));
    $('.J_Submit').on('click', $.proxy(this._submit, this));
    doc.on('tap', '.get-captcha', $.proxy(this._getCode, this));

    if (this.isWeixin()) {
      this.setupWeiXinShare('origin_share');
    }
  }

  _slideVerify() {
    var nc_appkey =  Config.getAliyunAppkey(); // 应用标识,不可更改
    var nc_scene = 'register_h5';  //场景,不可更改
    var nc_token = [nc_appkey, (new Date()).getTime(), Math.random()].join(':');
    var nc_option = {
        renderTo: '#dom_id',//渲染到该DOM ID指定的Div位置
        appkey: nc_appkey, 
        scene: nc_scene,
        token: nc_token,
        //trans: '{"name1":"code0"}',//测试用，特殊nc_appkey时才生效，正式上线时请务必要删除；code0:通过;code100:点击验证码;code200:图形验证码;code300:恶意请求拦截处理
        callback: function (data) {// 校验成功回调
            document.getElementById('csessionid').value = data.csessionid;
            document.getElementById('sig').value = data.sig;
            document.getElementById('token').value = nc_token;
            document.getElementById('scene').value = nc_scene;
            console.log(data)
            $('.click-verify').show();
            $('.slide-verify').hide();
        },
        error: function (s) {
          // console.log()
        },
        verifycallback: function (data) {
            if (data.code == "200") {
            }
        }
    };
    NoCaptcha.init(nc_option);
    NoCaptcha.setEnabled(true);
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

  _validatePasswrod() {
    var passwordEl = $('.J_Password'),
      password = passwordEl.val(),
      parent = passwordEl.parent();

    if (!password) {
      this.showError(parent, '请输入密码');
      return false;
    }
    else {
      this.hideError(parent);
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
    console.log(e)
    e.stopPropagation(); 
    e.preventDefault(); 
    var _this=this;
    var telEl = $('.phone').val(),
      curEl = $(e.currentTarget);
    if (curEl.hasClass('get-code')) {
      $('.code').removeAttr('disabled');
      if (curEl.hasClass('disable')) {
        return;
      }

      if (!this._validate() || !this._validatePasswrod()) {
        return;
      }
      // this.imageCap._show();
      $('.captcha-text').focus();
    }
    curEl.addClass('disable');
     this.ajax({
         url: '/v1/aliyun_captcha/' + telEl + '/?',
         type: 'post',
         data: {
            cc: 86,
            captcha: $('#J_ImageCaptcha .captcha-text' ).val(),
            wl: getWXWL(),
            _r: Math.random(),
            csessionid:document.getElementById('csessionid').value,
            sig:document.getElementById('sig').value,
            token:document.getElementById('token').value,
            scene:document.getElementById('scene').value
         }
     }).then(function(data) { 
      console.log(data)
      if ( data.data === false ) {
        new Toast('短信发送失败,检查手机号后重试！');
        _this._slideVerify();
        curEl.removeClass('disable');
        setTimeout(function () {
          $('.click-verify').hide();
          $('.slide-verify').show();
        },3000)   
      }else {
        $('#captcha-message').html('短信已发送!');
        curEl.addClass('disable');
        $('.code').removeAttr('disabled');
        setTimeout(function(){
          $('#get-captcha').removeClass('disable');
          _this._countdown($('.get-code'));
        }, 1000);
      }
       
     }).fail(function(data){
         _this._slideVerify();
         setTimeout(function () {
          $('.click-verify').hide();
          $('.slide-verify').show();
        },3000)   
     });
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

    if (!this._validate() || !this._validateCode() || !this._validatePasswrod()) {
      return false;
    }

    var phone = $('.phone').val(),
      cc = 86,
      vcode = $('.code-ipt').val(),
      password = $('.J_Password').val(),
      token = this.cookie.get('token');

    submitEl.html('处理中');
    submitEl.addClass('disable');

    // var from = new Uri().getParam('from');
    this.ajax({
      url: '/v1/user/create',
      type: 'post',
      data: {
        phone: phone,
        vcode: vcode,
        password: password,
        cc: 86,
        uuid: Util.guid(),
        nickname: self.getLogin()._generateNickname(),
        refer: self.inviteCode,
        source: this.cookie.get('source'),
        wl: getWXWL()
      }
    }).then(function(data) {

      // Cookie.set('real_token', data.data.real_token, {
      //   expires: Config.getRealPasswordExpireTime()
      // });
      Cookie.set('type', 'demo');
      // Cookie.set('goType', 'demo');

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
            self.finishRegister();
        });
      }
      // 没有邀请人就直接去option
      else {
        self.finishRegister();
      }

      

    }, function(data) {
      var parent = submitEl.parent('.wrapper');
      self.showError(parent, data.message);
      submitEl.html('接受注册邀请 领取赠金');
      submitEl.removeClass('disable');
    });
  }

  finishRegister() {
    var popupEl = $('#J_Popup');

    $('.form', popupEl).hide();

    // 微信里需要增加 关注微信入口
    if (this.isWeixin()) {
      var wx = '<a class="aa" href="https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=' + getWXIDWL() +'#wechat_redirect">点击关注微信公众号 享免费资讯服务</a>'
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