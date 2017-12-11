"use strict";

require('../../../lib/zepto');
var Base = require('../../../app/base');
var PageBase = require('../../../app/page-base');
var Validate = require('../../../common/validate');
var Uri = require('../../../app/uri');
var Cookie = require('../../../lib/cookie');
var Toast = require('../../../common/toast');
var Util = require('../../../app/util');

function Login() {
    Login.superclass.constructor.apply(this, arguments);
    var self = this;
    // this.getToken().then(function() {

    // });
    if (this.cookie.get('phone')) {
        location.href = '../option.html'
    } else {
        this.init();
    }
}

Base.extend(Login, PageBase, {
    init: function() {
        //this._resize();

        this._initAttrs();
        this._initValidate();
        this._bind();
        this.configStatistics();
    },

    _bind: function() {
        var doc = $(document);

        $('.J_Validate').on('change blur', $.proxy(this._change, this));
        $('.login').on('click', $.proxy(this._submit, this));
    },

    _change: function(e) {
        var curEl = $(e.currentTarget),
            parent = curEl.parent('.wrapper'),
            validator = this.validator;

        this.curEl = curEl;
        var value = curEl.val();
        var error;

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
            } else {
                this.hideError(parent);
            }
        } else if (curEl.hasClass('password')) {

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
        var html = '<div class="err">' + message + '</div>';

        wrapperEl.append(html);

    },

    hideError: function(wrapperEl) {
        wrapperEl.removeClass('error').addClass('success');
    },

    _submit: function(e) {
        var self = this,
            submitEl = $('.login');
        e.preventDefault();

        if (submitEl.hasClass('disable')) {
            return false;
        }

        var password = $('.password').val(),
            phone = $('.tel').val();

        if (!password || !phone) {
            return;
        }

        submitEl.text('处理中');
        self.ajax({
            url: '/v1/user/login',
            type: 'post',
            data: {
                phone: phone,
                password: password,
                cc: 86
            },
            noToast: true
        }).then(function(data) {
            data = data.data;

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

            if (!Cookie.get('type')) {
                Cookie.set('type', 'demo', {
                    expires: Infinity
                });
            }

            submitEl.text('登录');

            // if (self.isFromVip()) {
            //     location.href = $('.go-back').attr('href');
            // } else {
            location.href = '../option.html';
            // }


        }, function(data) {
            submitEl.text('登录');


            new Toast(data.message || '手机号或密码错误');
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
                if (/^(0|86|17951)?(13[0-9]|15[012356789]|18[0-9]|14[57]|17[0123456789])[0-9]{8}$/.test(value)) {
                    return true;
                }
                return false;
            })
            .setMessage('tel_number', '请输入正确的手机号码')
            .setMessage('required', '此项不能为空')
            .setMessage('matches', '两次输入密码不一致');

        this.validator = validator;
    },

    _initAttrs: function() {
        $('.register').attr('href', './home.html?src=' + encodeURIComponent(location.href));
        $('.recovery').attr('href', '../recovery-password.html?src=' + encodeURIComponent(location.href));

        // var src = new Uri().getParam('src');

        // if (src && src.indexOf('vip') !== -1) {
        //     $('.go-back').attr('href', src);

        //     if (Util.isWeixin()) {
        //         $('header').hide();
        //     }
        // }


        // $('body').css('height', $(window).height());
    },

    isFromVip: function() {
        var src = new Uri().getParam('src');

        if (src && src.indexOf('vip.html') !== -1) {
            return true;
        }
    },


    attrs: {
        formEl: $('#J_Form')
    }

});

new Login();