"use strict";

require('../../../lib/zepto');
//var Header = require('../../../common/header');
var PageBase = require('../../../app/page-base');
var Dialog = require('../../../common/dialog/index');
var Login = require('../../../common/login');
var Uri = require('../../../app/uri');
var Util = require('../../../app/util');
//var Slider = require('../../../common/slider/index');
var Slide = require('../../../common/slide/h');
var tmpl = require('./index.ejs');
var listTmpl = require('./list.ejs');


class MidAutumn extends PageBase {
    constructor() {
        super();


        // this.getToken().then(() => {
        this._requires();
        this._initAttrs();
        this._bind();
        // this._dialog();
        this._getList();
        //})
        this.setupWeiXinShare('autumn');

        //this._dialog('activity');
        if (this.cookie.get('token')) {
            $('.input-wrapper').css('visibility', 'hidden');
            $('#J_GetLuck').addClass('token');
        }
    }

    _bind() {
        var doc = $(document);

        var doc = $(document);

        doc.on('click', '.register', $.proxy(this._register, this));
        doc.on('tap', '.get-code', $.proxy(this._getCode, this));
        doc.on('tap', '.J_Activity', $.proxy(function() {
            this._dialog('activity');
        }, this));

        doc.on('tap', '#J_InfoImg', $.proxy(function() {
            $('#J_InfoImg').css('display', 'none');
        }, this));

        doc.on('click', '#J_GoRegister', (e) => {
                $(e.currentTarget).attr('href', '../register.html?src=' + encodeURIComponent(location.href));
            })
            .on('click', '#J_GoGetPassWord', (e) => {
                $(e.currentTarget).attr('href', '../recovery-password.html?src=' + encodeURIComponent(location.href));
            });

        $('.tel').on('focus', $.proxy(this._scrollIntoView, this));
    }

    _getList() {
        this.ajax({
            url: '/v1/marketing/2015fall/'
        }).then((data) => {
            this.render(listTmpl, data.data, $('#J_Slider'));
            // $('#J_Slider').slider({
            //     // loop: true,
            //     play: true,
            //     // interval: 500,
            //     duration: 5000,
            // });
            new Slide({
                el: $('#J_Slider'),
                duration: 3000,
                interval: 0
            })
        });
    }

    _getCode(e) {
        var curEl = $(e.currentTarget),
            parent = curEl.parent('.wrapper').parent('.input-wrapper').parent('.action-wrapper'),
            tel = $('.tel', parent).val();

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
                _r: Math.random()
                    //phone: telEl
            }
        }).then(function(data) {

        });
    }

    _countdown(el) {
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
    }

    _scrollIntoView(e) {
        var top = $(e.currentTarget).offset().top;
        var height = $(window).height();
        var timer;

        setTimeout(function() {
            document.body.scrollTop = height;
        }, 100);
    }

    _initHeight() {
        var winHeight = $(window).height(),
            navEl = $('.km-slider-nav');

        $('#slider').css('height', winHeight);
        navEl.css('top', winHeight - navEl.height() - 40);
    }

    _register(e) {
        var curEl = $(e.currentTarget),
            parent = curEl.parent('.action-wrapper'),
            telEl = $('.tel', parent),
            codeEl = $('.code', parent),
            tel = telEl.val().trim(),
            code = codeEl.val();

        if (curEl.hasClass('token')) {
            this.login.login().then(() => {
                this._getLock();
            });

            return;
        }

        if (!this._validate(tel)) {
            return;
        }

        if (!code) {
            var dialog = this.dialog;

            dialog.setContent('请输入验证码');
            dialog.show();
            return;
        }

        this._submit(tel, curEl, code);
    }

    _validate(tel) {
        var dialog = this.dialog;

        if (!tel) {
            dialog.setContent('请输入手机号码');
            dialog.show();
            return;
        }

        // 验证手机号，默认是11位  
        if (!/^1[3|4|5|7|8][0-9]\d{4,8}$/.test(tel)) {
            dialog.setContent('请输入正确的手机号码');
            dialog.show();
            return;
        }

        return true;
    }

    _submit(tel, submitEl, code) {
        var dialog = this.dialog,
            self = this;

        // if (!this._validate(tel)) {
        //     return;
        // }


        self.registerPhone = true;

        submitEl.val('处理中');
        this.ajax({
            url: '/v1/user',
            type: 'post',
            data: {
                phone: tel,
                vcode: code,
                cc: 86,
                uuid: Util.guid(),
                nickname: self.login._generateNickname()
            }
        }).then(function(data) {

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
            Cookie.set('type', getSimulatePlate() ? 'demo' : 'real', {
                expires: Infinity
            });
            // dialog.setContent('您已注册成功，登录密码已发送至您的手机，请注意查收。');
            // dialog.show();

            submitEl.val('抽流量');

            self.registerErr = false;
            this._getLock();
            // self._goRegister();
        }, (data) => {
            if (data.message.indexOf("手机号码已被注册") !== -1) {
                // this._getLock();
                this.login.login();
                
                var el = $('.guide')[1];
                var h = el.href;
                $('.guide')[1].href = el.origin + '/s' + h.substring(h.indexOf('/s/') + 11, h.length) + el.search;

                el = $('.forget')[1];
                h = el.href;
                $('.forget')[1].href = el.origin + '/s' + h.substring(h.indexOf('/s/') + 11, h.length) + el.search;
            } else {
                var dialog = self.dialog;

                dialog.setContent(data.message);
                dialog.show();
            }

            self.registerErr = true;

            submitEl.val('抽流量');
        });
    }

    _getLock() {

        return this.ajax({
            url: '/v1/marketing/2015fall/',
            data: {
                access_token: this.cookie.get('token')
            },
            type: 'post',
            noToast: true
        }).then((data) => {
            console.log(data);
            if (data.data.prize_id == 1) {
                this._dialog('money', data.data.prize_name);
            } else {
                this._dialog('luck', data.data.prize_name);
            }
            // alert(JSON.stringify(data))

        }, (data) => {
            if (data.message === '一天只能抽取一次') {
                this._dialog('done');
            }


            //alert(JSON.stringify(data))
        });
    }

    _goRegister() {
        if (!this.registerPhone || this.registerErr) {
            return;
        }

        if (this.isWeixin()) {
            var url = '?token=' + Cookie.get('token') + '&ri=' + window.location.origin + '/s/register-guide.html?f=g&s=b';
            url = this.weixinUrlFirst + encodeURIComponent(url) + this.weixinUrlLast;

            window.location = url;
        } else {
            // 直接跳转版本
            window.location = window.location.origin + '/s/register-guide.html';
        }
    }

    _requires() {
        //new Header();



        this.login = new Login();
    }

    _dialog(type, name) {

        var data = {};
        if (type === 'done') {
            data = {
                done: true
            };
        } else if (type === 'luck') {
            data = {
                luck: true,
                phone: this.cookie.get('phone'),
                name: name
            };
        } else if (type === 'money') {
            data = {
                money: true,
                name: name
            };
        } else if (type === 'activity') {
            data = {
                activity: true
            }
        }

        this.alert && this.alert.destroy();


        this.alert = new Dialog({
            isShow: true,
            tmpl: this.render(tmpl, data),
            confirmCallback: () => {
                $('#J_InfoImg').show();
            }
        });
    }

    _initAttrs() {
        this.tmpl = [
            '<div class="dialog-ios8 J_Dialog" id="J_Dialog">',
            '   <div class="dialog-title-ios8">提示</div>',
            '   <div class="dialog-content-ios8 J_Content"><%= data.content %></div>',
            '   <div class="dialog-buttons-ios8">',
            '       <span class="dialog-btn J_DialogClose" data-idx="alert0">知道了</span>',
            '   </div>',
            '</div>',
            '<div class="dialog-mask J_DialogMask"></div>'
        ].join('');

        this.dialog = new Dialog({
            isShow: false,
            tmpl: this.tmpl,
            cancleCallback: $.proxy(function() {
                this._goRegister();
                this.confirm = true;
            }, this)
        });
    }

    _done() {
        _
    }
}

new MidAutumn();