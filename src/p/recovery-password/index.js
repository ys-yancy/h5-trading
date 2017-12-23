"use strict";

var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var Config = require('../../app/config.js');
var Validate = require('../../common/validate');
var Cookie = require('../../lib/cookie');
var Uri = require('../../app/uri');
var Toast = require('../../common/toast');
var CustomerService = require('../../common/customer-service'); 
var ImageCaptcha = require('../../common/image-captcha');

function RecoveryPassword() {
    RecoveryPassword.superclass.constructor.apply(this, arguments);
     var self = this;
    // this.getToken().then(function() {
        self.init();
    // });
}

Base.extend(RecoveryPassword, PageBase, {
    init: function() {
        this._initAttrs();
        this._initValidate();
        this._bind();
        this._requires();
        this.configStatistics();
        if ( getSimulatePlate() ) {} else {
            $('nav').remove();
        }
    },

    _bind: function() {
        var doc = $(document);
        
        if ( Config.isAndroidAPK() ) {
            $('.click-verify').show();
            $('.slide-verify').hide();
        } else {
            $('.click-verify').hide();
            $('.slide-verify').show();
            this._slideVerify();
        }

        
        $('.J_Validate').on('change blur', $.proxy(this._change, this));
        $('form').on('submit', $.proxy(this._submit, this));
        doc.on('touchend', '.get-code', $.proxy(this._getCode, this));
        doc.on('touchend', '.get-captcha', $.proxy(this._getCode, this));

        // 添加默认微信分享
        if (this.isWeixin()) {
          this.setupWeiXinShare('default_invite');
        }
    },

    _slideVerify: function() {
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
            if ($('.J_Second').parents('.wrapper').hasClass('success')) {
                $('.J_Second').val($('.J_First').val());
            }
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
                $(parent[0]).find('.error-icon').on('tap',function () {
                    $(this).parent().find('.J_Validate').val('');
                })
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
                    $(parent[0]).find('.error-icon').on('tap',function () {
                        $(this).parent().find('.J_Validate').val('');
                    })
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
            '   <span class="icon"></span>',
            '   <p>' + message + '</p>',
            '</div>'
        ].join('');

        wrapperEl.append(html);

    },

    _getCode: function(e) {
        var _this=this;
        var telEl = $('.tel').val(),
            curEl = $(e.currentTarget);
        if (curEl.hasClass('get-code')) {
            $('.code').removeAttr('disabled');
            if (curEl.hasClass('disable')) {
                return;
            }
    
            var telEl = $('.tel').val();
    
            if (!telEl) {
                return;
            }
            var pwd = $('.password').val();
            var rpwd = $('.repassword').val();
    
            if ( !pwd || pwd != rpwd) {
                return;
            }

            if ( Config.isAndroidAPK() ) {
                this.imageCap._show();
            }

            $('.captcha-text').focus();
        }

      if ( Config.isAndroidAPK() ) {
        if (curEl.hasClass('get-captcha')) {
          var captInput = $('#J_ImageCaptcha .captcha-text' );
          if (captInput.val().length!==4){
            $('#captcha-message').html('验证码错误!');
            $('#J_ImageCaptcha .captcha-text').val('');
            this.imageCap._show();
            $('.captcha-text').focus();
          }else{
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

      } else {
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
            $('.code').removeAttr('disabled');
            setTimeout(function(){
              $('#get-captcha').removeClass('disable');
              _this._countdown($('.get-code'));
            }, 0);
          }
            
        }).fail(function(data){
                curEl.removeClass('disable');
                _this._slideVerify();
                setTimeout(function () {
                $('.click-verify').hide();
                $('.slide-verify').show();
            },3000)   
        });
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
            vcode = $('.code-ipt').val(),
            token = Cookie.get('token');

        this.ajax({
            url: getSimulatePlate() ? '/v1/user/password/' : '/v1/user/real/tradepassword/setnew/',
            type: getSimulatePlate() ? 'put' : 'post',
            data: {
                password: password,
                phone: phone,
                vcode: vcode,
                cc: 86,
                access_token: token,
                wl: getWXWL()
            }
        }).then(function(data) {

            // 找回密码并不会下行token, 所以不能记录phone
            /*
            Cookie.set('phone', $('.tel').val(), {
                expires: Infinity
            });
            */


            // 调整33接口, 下行修改密码的那个用户的token, 这里可以记录用户登录状态
            
            if(data.data.token) {
                Cookie.set('phone', phone);
                Cookie.set('token', data.data.token);
                Cookie.set('inviteCode', data.data.invite_code);
                Cookie.set('uuid', data.data.uuid);
            }
            


            new Toast('修改密码成功！');
            setTimeout(function() {
                location.href = self.linkHref;
            }, 1500);
        }, function(data) {
            var parent = submitEl.parent('.wrapper');
            self.showError(parent, data.message);
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
                if (/^(0|86|17951)?(13[0-9]|15[012356789]|18[0-9]|14[57]|17[0-9])[0-9]{8}$/.test(value)) {
                    return true;
                }
                return false;
            })
            .setMessage('tel_number', '请输入正确的手机号码')
            .setMessage('required', '此项为必填项目')
            .setMessage('matches', '两次输入密码不一致');

        this.validator = validator;
    },

    _initAttrs: function() {
        var src = new Uri().getParam('src');

        this.linkHref = src;
        $('.go-back').attr('href', src);
        $('.J_TradeHtmlLink').attr('href', '././recovery-trade-password.html?src=' + src);
    },

    _requires: function() {
        // new CustomerService();
        this.imageCap = new ImageCaptcha();
    },

    attrs: {
        formEl: $('#J_Form')
    }

});

new RecoveryPassword();