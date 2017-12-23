"use strict";

var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var Validate = require('../../common/validate');
var Uri = require('../../app/uri');
var Util = require('../../app/util');
var Cookie = require('../../lib/cookie');
var Login = require('../../common/login');
var Toast = require('../../common/toast');
var Config = require('../../app/config');
var ImageCaptcha = require('../../common/image-captcha');

function Register() {
    Register.superclass.constructor.apply(this, arguments);
    var self = this;
    // this.getToken().then(function() {
    self.init();
    // });
}

Base.extend(Register, PageBase, {
    init: function() {
        this._initAttrs();
        this._requires();
        this._initValidate();
        this._bind();
        this.configStatistics();

        if (location.search.indexOf('android-guide') != -1) {
            Cookie.set('source', 'AndroidApp');
        }
    },

    _bind: function() {
        var doc = $(document);

        $('.J_Validate').on('change blur', $.proxy(this._change, this));
        $('form').on('submit', $.proxy(this._submit, this));
        doc.on('tap', '.get-code', $.proxy(this._getCode, this));
        doc.on('tap', '.get-captcha', $.proxy(this._getCode, this));
        // doc.on('tap', '.J_StatementCheck', $.proxy(this._checkStatement, this));

        if (Config.isAndroidAPK() || !getIfShowDLinkWL()) {
            $('#J_Banner').remove();
        }

        // 添加默认微信分享
        if (this.isWeixin()) {
          this.setupWeiXinShare('default_invite');
        }
    },

    _change: function(e) {
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
        } else if (curEl.hasClass('password')) {
            if (!curEl.hasClass('repassword')) {
                error = validator.validateField({
                    name: 'password',
                    rules: 'required',
                    value: value
                });

                if (error) {
                    this.showError(parent, error.message);
                } else {
                    this.hideError(parent);
                }
            } else {
                error = validator.validateField({
                    name: 'repassword',
                    rules: 'required|matches[password]',
                    value: value
                });

                if (error) {
                    this.showError(parent, error.message);
                } else {
                    this.hideError(parent);
                }
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

        var disable = false;

        $('.wrapper', '#J_Form').each(function(index, item) {
            item = $(item);
            if (!item.hasClass('submit-wrapper')) {
                if (!$(item).hasClass('success')) {
                    disable = true;
                }
            }
            /*
            if (!$('.J_StatementCheck').hasClass('checked')) {
                disable = true;
            }
            */
        });

        if (disable) {
            submitEl.addClass('disable');
        } else {
            submitEl.removeClass('disable');
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
            '   <p  class="err">' + message + '</p>',
            '</div>'
        ].join('');

        wrapperEl.append(html);

    },

    _getCode: function(e) {
        var tel = $('.tel').val(),
            curEl = $(e.currentTarget);
        if (curEl.hasClass('get-code')) {
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
           
        }).fail(function(data){
            $('#captcha-message').html('验证码错误!');
            $('#J_ImageCaptcha .captcha-text').val('');
            _this.imageCap._show();
            $('.captcha-text').focus();
            curEl.removeClass('disable');
        });
      }
    }   
    },

    _countdown: function(el) {
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
    },

    hideError: function(wrapperEl) {
        wrapperEl.removeClass('error').addClass('success');

    },

    _submit: function(e) {
        var self = this,
            submitEl = $('.submit');
        e.preventDefault();

        if (submitEl.hasClass('disable')) {
            return false;
        }

        var password = $('.password').val(),
            phone = $('.tel').val(),
            cc = 86,
            vcode = $('.code').val(),
            token = Cookie.get('token');

        submitEl.val('处理中');

        var from = new Uri().getParam('from');

        self.registerPhone = true;

        // 从android客户端里注册的情况, 需要记录所有信息
        if (Config.isAndroidAPK()) {
            this.ajax({
                url: '/v1/user/create', 
                data: {
                    phone: phone,
                    vcode: vcode,
                    password: password,
                    uuid: Cookie.get('uuid') || Util.guid(),
                    nickname: self._generateNickname(),
                    cc: 86,
                    source: Cookie.get('source'),
                    wl: getWXWL()
                },
                type: 'post'
            }).then(function(data) {

                Cookie.set('real_token', data.data.real_token, {
                    expires: Config.getRealPasswordExpireTime()
                });
                Cookie.set('type', 'real');
                Cookie.set('goType', 'real');

                Cookie.set('phone', $('.tel').val(), {
                    expires: Infinity
                });
                Cookie.set('token', data.data.token, {
                    expires: Infinity
                });
                Cookie.set('inviteCode', data.data.invite_code, {
                    expires: Infinity
                });
                Cookie.set('uuid', data.data.uuid, {
                    expires: Infinity
                });

                self.registerErr = false;

                new Toast('注册成功');
                setTimeout(function() {
                    location.href = './option.html';
                }, 1500);
                submitEl.val('注册');
            }, function(data) {
                var parent = submitEl.parent('.wrapper');
                self.showError(parent, data.message);
                submitEl.val('注册');
            });
        }
        else {
            this.ajax({
                url: '/v1/user/create', 
                data: {
                    phone: phone,
                    vcode: vcode,
                    password: password,
                    uuid: Cookie.get('uuid') || Util.guid(),
                    nickname: self._generateNickname() /*$('.name').val()*/ ,
                    refer: self.referCode,
                    cc: 86,
                    source: Cookie.get('source'),
                    wl: getWXWL()
                },
                type: 'post'
            }).then(function(data) {

                Cookie.set('real_token', data.data.real_token, {
                    expires: Config.getRealPasswordExpireTime()
                });
                Cookie.set('type', 'real');
                Cookie.set('goType', 'real');

                Cookie.set('phone', $('.tel').val(), {
                    expires: Infinity
                });
                Cookie.set('token', data.data.token, {
                    expires: Infinity
                });
                Cookie.set('inviteCode', data.data.invite_code, {
                    expires: Infinity
                });
                Cookie.set('uuid', data.data.uuid, {
                    expires: Infinity
                });

                self.registerErr = false;

                submitEl.val('注册');

                // 如果有邀请人就默认帮用户把红包领了
                if (self.referCode) {
                    self._getLottery();
                }
                // 没有邀请人就直接去option
                else {
                    self._goRegister();
                }

                new Toast('注册成功');
                setTimeout(function() {
                    location.href = './option.html';
                }, 1500);
                
            }, function(data) {
                self.registerErr = true;

                var parent = submitEl.parent('.wrapper');
                self.showError(parent, data.message);
                submitEl.val('注册');
            });
        }
    },

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
    },

    _goRegister() {
        if (!this.registerPhone || this.registerErr) {
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
                if (/((\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$)/.test(value)) {
                    return true;
                }
                return false;
            })
            .setMessage('tel_number', '请输入正确的手机号码')
            .setMessage('required', '此项为必填项目')
            .setMessage('matches', '两次输入密码不一致');

        this.validator = validator;
    },

    _checkStatement: function(e) {
        var curEl = $(e.currentTarget);
        var submitEl = $('.submit');

        curEl.toggleClass('checked');

        if (curEl.hasClass('checked')) {
            curEl.parent().removeClass('error');

            var disable = false;

            $('.wrapper', '#J_Form').each(function(index, item) {
                item = $(item);
                if (!item.hasClass('submit-wrapper')) {
                    if (!$(item).hasClass('success')) {
                        disable = true;
                    }
                }

                if (!$('.J_StatementCheck').hasClass('checked')) {
                    disable = true;
                }
            });

            !disable && submitEl.removeClass('disable');
        } else {

            submitEl.addClass('disable');
        }
    },

    _requires: function() {
        this.login = new Login();
        this.imageCap = new ImageCaptcha();
    },

    _generateNickname() {
        var date = new Date();
        var minite = date.getMinutes();
        var second = date.getSeconds();
        var millsecond = date.getMilliseconds();

        var nickname = getDefaultNicknamePrefix() + minite + '' + second + '' + millsecond;

        return nickname;
    },

    _initAttrs: function() {
        var params = new Uri().getParams();
        var url = params.src;

        if (url) {
            $('.go-back', 'header').attr('href', url);
            this.url = url;
        }

        this.referCode = Cookie.get('referCode');
        if (!this.referCode) {
          this.referCode = new Uri().getNextPath('/i/', 6);
          if(!this.referCode){
            this.referCode=params.referCode;
          }
          Cookie.set('referCode', this.referCode);
        }


        var statementEl = $('#J_Statement');
        var href = statementEl.attr('href');

        statementEl.attr('href', href + '?src=' + encodeURIComponent(location.href));
    },

    attrs: {
        formEl: $('#J_Form')
    }

});

new Register();