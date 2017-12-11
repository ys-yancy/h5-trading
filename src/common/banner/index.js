var Base = require('../../app/base');

var Cookie = require('../../lib/cookie');
var Login = require('../login');

function Banner() {
    Banner.superclass.constructor.apply(this, arguments);
    this.init();
}

Base.extend(Banner, Base, {
    init: function() {
        this._initAttrs();
        this._requires();
        this._bind();
    },

    _bind: function() {
        this.el.on('click', '.J_CloseBanner', $.proxy(this._close, this));
        this.el.on('click', '.J_Login', $.proxy(this._login, this));
        this.subscribe('login:success', $.proxy(this._close, this));
    },

    _close: function() {
        this.el.hide();
    },

    _login: function() {
        this.login.showLogin();
    },

    isLogin: function() {
       return  this.login.isLogin(true);
    },

    _requires: function() {
        this.login = new Login();
    },

    // _login: function() {
    //     this._hideMessage();
    //     this.dialog.show();
    // },

    // _requires: function() {
    //     var self = this;

    //     this.dialog = new Dialog({
    //         isShow: false,
    //         tmpl: this.tmpl,
    //         confirmCallback: function() {
    //             var el = self.dialog.el,
    //                 telEl = $('.tel', el),
    //                 tel = telEl.val(),
    //                 passEl = $('.password', el),
    //                 pass = passEl.val();

    //             if (!tel) {
    //                 self.showError(telEl.parent('.wrapper'), '手机号不能为空');
    //                 return;
    //             } else {
    //                 var regPhone = /^(0|86|17951)?(13[0-9]|15[012356789]|18[0-9]|14[57])[0-9]{8}$/;
    //                 if (!regPhone.test(tel)) {
    //                     self.showError(telEl.parent('.wrapper'), '请输入正确的手机号');
    //                     return;
    //                 }
    //             }

    //             if (!pass) {
    //                 self.showError(passEl.parent('.wrapper'), '密码不能为空');
    //             }
    //             return;

    //             self.ajax({
    //                 url: '/v1/user/login',
    //                 type: 'post',
    //                 data: {
    //                     Phone: tel,
    //                     Password: pass,
    //                     cc: ''
    //                 }
    //             }).then(function(data) {
    //                 self._hideMessage();
    //                 self.dialog.hide();
    //                 self.el.hide();
    //             }, function(data) {
    //                 self._showMessage(data.message);
    //             });
    //         }
    //     });
    // },

    // showError: function(wrapperEl, message) {
    //     var errorEl = $('.error', wrapperEl);
    //     wrapperEl.addClass('error').removeClass('success');
    //     if (errorEl.length > 0) {
    //         var msgEl = $('p', wrapperEl).text(message);
    //         return;
    //     }
    //     var html = [
    //         '<div class="error">',
    //         '   <span class="icon"></span>',
    //         '   <p>' + message + '</p>',
    //         '</div>'
    //     ].join('');

    //     wrapperEl.append(html);

    // },

    // hideError: function(wrapperEl) {
    //     wrapperEl.removeClass('error').addClass('success');

    // },

    // _hideMessage: function() {
    //     var el = this.dialog.el,
    //         messageEl = $('.J_Message', el);

    //     messageEl.hide();
    // },

    // _showMessage: function(message) {
    //     var el = this.dialog.el,
    //         messageEl = $('.J_Message', el);

    //     messageEl.show().html(message);
    // },

    _initAttrs: function() {
        var token = Cookie.get('token'),
            phone = Cookie.get('phone');

        if (token && phone) {
            return;
        }
        $('#J_Banner').show();
    }

    // attrs: {
    //     tmpl: [
    //         '<div class="dialog J_Dialog dialog-login" id="J_Dialog">',
    //         '   <div class="dialog-title">登录</div>',
    //         '   <span class="dialog-close icon J_DialogClose"></span>',
    //         '   <div class="dialog-content J_Content">',
    //         '       <div class="wrapper">',
    //         '        <input class="tel" type="text" placeholder="请输入手机号" >',
    //         '        <span class="icon phone"></span>',
    //         '       </div>',
    //         '       <div class="wrapper">',
    //         '        <input class="password" type="password" placeholder="请输入登录密码">',
    //         '        <span class="icon lock"></span>',
    //         '       </div>',
    //         '   </div>',
    //         '   <div class="dialog-buttons clearfix">',
    //         '       <p class="J_Message message"></p>',
    //         '       <span class="dialog-btn J_DialogConfirm" data-idx="alert0">登录</span>',
    //         '       <span class="dialog-btn J_DialogClose" data-idx="alert0">取消</span>',
    //         '       <a class="guide" href="./register.html">没有帐号？立即注册</a>',
    //         '   </div>',
    //         '</div>',
    //         '<div class="dialog-mask J_DialogMask"></div>'
    //     ].join('')
    // }
});

module.exports = Banner;