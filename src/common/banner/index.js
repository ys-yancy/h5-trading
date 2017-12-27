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

    _initAttrs: function() {
        var token = Cookie.get('token'),
            phone = Cookie.get('phone');

        if (token && phone) {
            return;
        }
        $('#J_Banner').show();
    }
});

module.exports = Banner;