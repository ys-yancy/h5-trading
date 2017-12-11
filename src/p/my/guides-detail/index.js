'use strict';

var PageBase = require('../../../app/page-base');
var Config = require('../../../app/config');
var Toast = require('../../../common/toast');
var Util = require('../../../app/util');
var tmpl = require('./index.ejs');
var Uri = require('../../../app/uri');
var ImageCaptcha = require('../../../common/image-captcha');


export default class GuidesDetail extends PageBase {
  constructor() {
    super();

    this._setMonth();
    this._getRank();
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
    this.inviteCode = params.referCode || params.inviteCode;

    if (!this.inviteCode) {
      // 从r文件取注册赠金数据
      $('#J_RegBonus').text('$ ' + getRegBonus());
    } else {
      $('.J_Up').attr('href', $('.J_Up')[0].pathname + '?inviteCode=' + this.inviteCode);

      // 从r文件取赠金数据
      $('#J_RegBonus').text('$ ' + (getRegBonus() + getInviteRegBonus()));
    }

  }

  _setMonth() {
    var month = new Date().getMonth();
    console.log(month)

    $('#J_Month').addClass('month-' + (month + 1));
  }

  _getRank() {
    this.ajax({
      url: 'v1/rank/ror/month',
      data: {
        equity_threshold: 100,
        limit: 5
      }
    }).then((data) => {

      data = data.data;

      data.forEach((item) => {
        item.avatar = item.avatar ? Config.getAvatarPrefix(item.avatar) : getDefaultIconWL();
      });

      this.render(tmpl, data, $('#J_List'));

      console.log(data);
    })
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

    // 添加默认微信分享
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
      return;
    }

    var phone = $('.phone').val(),
      password = $('.J_Password').val(),
      cc = 86,
      vcode = $('.code-ipt').val(),
      token = this.cookie.get('token');

    submitEl.val('处理中');

    // var from = new Uri().getParam('from');

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
      submitEl.val('立即注册 领取$15');
    });

    // // H5版本绑定手机号, 不需要更新token等信息
    // this.ajax({
    //   url: '/v1/user/phone/',
    //   type: 'put',
    //   data: {
    //     phone: phone,
    //     vcode: vcode,
    //     cc: 86,
    //     access_token: token,
    //     invite_code: this.cookie.get('referCode')
    //   }
    // }).then((data) => {
    //   this.cookie.set('phone', $('.tel').val(), {
    //     expires: Infinity
    //   });

    //   new Toast('注册成功');
    //   setTimeout(function() {
    //     if (self.url) {
    //       location.href = self.url;
    //       return;
    //     }
    //     location.href = '../option.html';
    //   }, 1500);
    //   submitEl.val('立即注册 领取$15');
    // }, function(data) {
    //   var parent = submitEl.parent('.wrapper');
    //   self.showError(parent, data.message);
    //   submitEl.val('立即注册 领取$15');
    // });

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

new GuidesDetail();