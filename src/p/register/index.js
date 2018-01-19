"use strict";

var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var Validate = require('../../common/validate');
var Uri = require('../../app/uri');
var Util = require('../../app/util');
var Cookie = require('../../lib/cookie');
var Toast = require('../../common/toast');
var Config = require('../../app/config');
var ImageCaptcha = require('../../common/image-captcha');

function Register() {
    Register.superclass.constructor.apply(this, arguments);
    this.init();
}

Base.extend(Register, PageBase, {
    init: function() {
        this._initAttrs();
        this._requires();
        this._initValidate();
        this._bind();
        this.configStatistics();
    },

    _bind: function() {
        var doc = $(document);

        doc.on('tap', '.get-code', $.proxy(this._getCode, this));
        doc.on('tap', '.get-captcha', $.proxy(this._sedMsg, this));

        $('form').on('submit', $.proxy(this._submit, this));
        $('.J_Validate').on('change blur', $.proxy(this._change, this));
       
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

    _getCode: function(e) {
        var telEl = $('.tel'),
            tel = telEl.val(),
            curEl = $(e.currentTarget);

        if (!tel) {
            telEl.trigger('change');
            return;
        }
            
        if (curEl.hasClass('get-code')) {
            $('.code').removeAttr('disabled');
            this.imageCap._show();
            $('.captcha-text').focus();
        }
    },

    _sedMsg: function(e) {
        var self = this;
        var tel = $('.tel').val(),
            curEl = $(e.currentTarget);

        var captInput = $('#J_ImageCaptcha .captcha-text' ),
            errorMessageEl = $('#captcha-message'),
            imegeCode = captInput.val();

        if(imegeCode.length !== 4) {
            self._showImageMsg(errorMessageEl, captInput, curEl);
            return;
        } 

        this.ajax({
            url: '/v1/captcha/' + tel,
            type: 'post',
            data: {
                cc: 86,
                captcha: imegeCode,
                wl: getWXWL(),
                _r: Math.random()
            }
        }).then(function(data) {
            if (data.status != 200) {
                self._showImageMsg(errorMessageEl, captInput, curEl);
                return;
            }
            self._hideImageMsg(errorMessageEl, curEl);
           
        }).fail(function(data) {
            self._showImageMsg(errorMessageEl, captInput, curEl);
        })
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
                    source: self.source,
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
                    nickname: self._generateNickname(),
                    refer: self.referCode,
                    cc: 86,
                    source: self.source,
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

                Cookie.set('deposits', data.data.deposits || 0, {
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

        if (this.isWeixin() && getUserInfoWX()) {
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

    _requires: function() {
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

    hideError: function(wrapperEl) {
        wrapperEl.removeClass('error').addClass('success');

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

    _showImageMsg: function(errorMessageEl, captInput, curEl) {
        errorMessageEl.html('验证码错误!');
        captInput.val('');
        curEl.removeClass('disable');
        this.imageCap._refresh();
    },

    _hideImageMsg: function(errorMessageEl, curEl) {
        errorMessageEl.html('短信已发送!');
        curEl.addClass('disable');
        $('.code').removeAttr('disabled');
        setTimeout(() => {
            this.imageCap._hide();
            curEl.removeClass('disable');
            this._countdown($('.get-code'));
        }, 1000); 
    },

    _initAttrs: function() {
        var params = new Uri().getParams();

        // 记录用户来源, 优先取微信的from, 其次是我们自己定的source
        this.source = params.from ? params.from : params.source;
        this.source = this.source || this.cookie.get('source');
        this.cookie.set('source', this.source);

        this.referCode = params.inviteCode || this.cookie.get('referCode');
        this.cookie.set('referCode', this.referCode);

        var url = params.src;
        if (url) {
            $('.go-back', 'header').attr('href', url);
            this.url = url;
        }
    },

    attrs: {
        formEl: $('#J_Form')
    }

});

new Register();