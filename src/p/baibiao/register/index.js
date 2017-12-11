"use strict";

require('../../../lib/zepto');
// var Header = require('../../../common/header');
var PageBase = require('../../../app/page-base');
var Util = require('../../../app/util');
var Uri = require('../../../app/uri');
var Config = require('../../../app/config');
var Toast = require('../../../common/toast');
var Login = require('../../../common/login');
var tmpl = require('./index.ejs');

class Register extends PageBase {
    constructor() {
        super();

        this._bind();
        this.configStatistics();
        
        this.login = new Login();

        if (this.cookie.get('phone')) {
            location.href = '../option.html'
        }
    }

    _bind() {
        var doc = $(document);

        $('.tel').on('change blur', $.proxy(this._validate, this));
        $('.tel').on('focus', $.proxy(this._intervalCheck, this));



        doc.on('tap', '.register', $.proxy(this._register, this));
        doc.on('tap', '.get-code', $.proxy(this._getCode, this));

        // $('.action-wrapper').on('submit', $.proxy(function(e) {
        //     var curEl = $(e.currentTarget),
        //         telEl = $('.tel', curEl),
        //         tel = telEl.val();
        //     e.preventDefault();

        //     this._submit(tel);

        // }, this));

        // $('.tel').on('focus', $.proxy(this._scrollIntoView, this));

    }

    _intervalCheck(e) {
        clearInterval(this.timer);

        this.timer = setInterval(() => {
            var tel = $('.tel').val();
            // 验证手机号，默认是11位  
            if (tel && /^1[3|4|5|7|8][0-9]\d{8}$/.test(tel)) {
               this._hideError($('.tel').parent());
            }
        }, 50);
    }

    _getCode(e) {
        var curEl = $(e.currentTarget),
            tel = $('.tel').val();

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
        var tel = $('.tel').val();
        var telParent = $('.tel').parent();

        if (!tel) {
            this._showError(telParent, '请输入手机号码');
            return;
        }

        // 验证手机号，默认是11位  
        if (!/^1[3|4|5|7|8][0-9]\d{8}$/.test(tel)) {
            this._showError(telParent, '请输入正确的手机号码');

            return;
        }

        this._hideError(telParent);

        return true;
    }

    _register(e) {
        var curEl = $(e.currentTarget),
            // parent = curEl.parent('.action-wrapper'),
            telEl = $('.tel'),
            codeEl = $('.code'),
            tel = telEl.val(),
            code = codeEl.val();

        if (!tel) {
            this._showError(telEl.parent(), '请输入手机号');
            return;
        } else {
            this._hideError(telEl.parent());
        }


        if (!code) {
            this._showError(codeEl.parent(), '请输入验证码');
            return;
        } else {
            this._hideError(codeEl.parent());
        }

        this._submit(tel, curEl, code);
    }



    _submit(tel, submitEl, code) {
        if (!this._validate(tel)) {
            return;
        }


        // dialog.setContent('您已注册成功，登录密码已发送至您的手机，请注意查收。');
        // dialog.show();
        this.registerPhone = true;

        var self = this;

        submitEl.val('处理中...');
        this.ajax({
            url: '/v1/user/create',
            type: 'post',
            data: {
                phone: tel,
                vcode: code,
                cc: 86,
                uuid: Util.guid(),
                nickname: this.login._generateNickname(),
                refer: new Uri().getParam('referCode'),
                source: Cookie.get('source'),
                wl: getWXWL()
            }
        }).then((data) => {

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

            this.registerErr = false;
            
            // 如果有邀请人就默认帮用户把红包领了
            if (data.data.refer_code) {
                self._getLottery();
            }
            // 没有邀请人就直接去option
            else {
                self._goRegister();
            }
        }, (data) => {
            this.registerErr = true;
            // this._showError(data.message);
            new Toast(data.message);
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
            self._goRegister();
        });
    }

    _goRegister() {
        if (this.registerErr) {
            return;
        }
        // /wetrade008/s/baibiao/home.html
        
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
    }

    _showError(wrapperEl, message) {
        var errorEl = $('.error', wrapperEl);
        wrapperEl.addClass('error').removeClass('success');
        if (errorEl.length > 0) {
            var msgEl = $('p', wrapperEl).text(message);
            return;
        }
        var html = '<div class="err">' + message + '</div>';

        wrapperEl.append(html);

    }

    _hideError(wrapperEl) {
        wrapperEl.removeClass('error').addClass('success');
    }
}

new Register();