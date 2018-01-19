"use strict";

var Header = require('../../../common/header');
var PageBase = require('../../../app/page-base');
var Uri = require('../../../app/uri');
var Util = require('../../../app/util');
var Config = require('../../../app/config');
var Toast = require('../../../common/toast');
var Sticky = require('../../../common/sticky');
var Dialog = require('../../../common/dialog');
var SyncInfo = require('./sync-info/index');
var photoTmpl = require('./tpl/photo.ejs');
var logoutTmpl = require('./tpl/logout.ejs');

class Profile extends PageBase {
  constructor() {
    super();
    this._preBind();
    this._initAttrs();
    this.login().then(function() {
      this.getAccount().then(function(account) {
        this._render(account);
        this._requires();
        this._bind();
        this.configStatistics();
        this._getAuth();
      }.bind(this));
    }.bind(this), function() {
      location.href = '../option.html';
    });
  }

  _preBind() {
    var doc = $(document);
    doc.on('click', '#J_GoRegister', $.proxy(this._register, this));
    doc.on('click', '#J_GoGetPassWord', $.proxy(this._getPassword, this));
  }

  _register(e) {
    var curEl = $(e.currentTarget);
    curEl.attr('href', '../register.html?src=' + encodeURIComponent(location.href));
  }

  _getPassword(e) {
    var curEl = $(e.currentTarget);
    curEl.attr('href', '../recovery-password.html?src=' + encodeURIComponent(location.href));
  }

  _bind() {
    var doc = $(document);
    doc.on('change', '.upload-input', $.proxy(this._preview, this));
    doc.on('tap', '.J_Edit', $.proxy(this._editNickname, this));
    doc.on('tap', '.J_Save', $.proxy(this._saveNickname, this));
    doc.on('tap', '.J_ShwoAuthContent', $.proxy(this._shwoAuthContent, this));
    doc.on('tap', '.J_Logout', $.proxy(this._logout, this));
    $('.J_Data').on('click', $.proxy(this._setData, this));
    $('.J_Order').on('click', $.proxy(this._setOrder, this));
    $('.J_History').on('click', $.proxy(this._setHistory, this));
    $('.J_Quan').on('click', $.proxy(this._setQuan, this));

    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('profile');
    }
  }

  _editNickname(e) {
    var curEl = $(e.currentTarget);
    var parentEl = curEl.parent().parent('.name-wrapper');
    parentEl.addClass('editable');
  }

  _saveNickname(e) {
    var curEl = $(e.currentTarget),
      parentEl = curEl.parent('.name-wrapper'),
      inputEl = $('input', parentEl),
      nickname = inputEl.val();

    if (!nickname) {
      $('.error', parentEl).text('昵称不能为空！').show();
      return;
    }

    this.ajax({
      url: '/v1/user',
      type: 'put',
      data: {
        access_token: this.cookie.get('token'),
        nickname: nickname
      }
    }).then(function(data) {
      $('.error', parentEl).hide();
      parentEl.removeClass('editable');
      $('.nickname', parentEl).text(nickname);
    });
  }

  _shwoAuthContent(e) {
    var curEl = $(e.currentTarget),
      bdEl = $('.auth-bd');
    if (curEl.hasClass('show')) {
      curEl.removeClass('show');
      bdEl.removeClass('show');
      return
    }
    curEl.addClass('show');
    bdEl.addClass('show');
  }

  _render(account) {
    account.avatar = account.avatar ? Config.getAvatarPrefix(account.avatar) : getDefaultIconWL();
    this.render(photoTmpl, account, $('#J_HD'));

    $('.phone').val(account.phone || '--');

    var day = parseInt((Date.now() - Util.getTime(account.created)) / (1000 * 60 * 60 * 24));
    $('.num').text(day);

    var email = account.email;
    if (email) {
      $('.J_Email').text(email).show();
    }
  }

  _preview(e) {
    var self = this;

    // android webview使用一个单独的版本
    if (Config.isAndroidAPK()) {
      var reader = new FileReader();
      console.log("reader: " + reader);
      reader.onloadend = function() {
        var dataUrl = reader.result;
        console.log("dataUrl.length = " + dataUrl.length);
        var index = 0;
        while (index + 512 < dataUrl.length) {
          var res = dataUrl.substring(index, index + 512);
          console.log(res);
          index += 512;
        }
        self._changeAvatar(dataUrl);
      }
      reader.readAsDataURL(e.currentTarget.files[0]);
    } else {
      lrz(e.currentTarget.files[0], {
        // 压缩开始
        before: function() {
          console.log('压缩开始');
        },
        // 压缩失败
        fail: function(err) {
          console.error(err);
        },
        // 压缩结束（不论成功失败）
        always: function() {
        },
        // 压缩成功
        done: function(results) {
          // 你需要的数据都在这里，可以以字符串的形式传送base64给服务端转存为图片。
          self._changeAvatar(results.base64);
        }
      });
    }
  }

  _logout() {
    var dialog = new Dialog({
      isShow: true,
      tmpl: this.render(logoutTmpl),
      confirmCallback: logout
    });

    function logout() {

      Cookie.expire('real_token');
      Cookie.expire('phone');
      Cookie.expire('goType');
      Cookie.expire('type');
      Cookie.expire('uuid');
      Cookie.expire('inviteCode');
      Cookie.expire('token');
      Cookie.expire('deposits');
      Cookie.expire('is_open_account');

      window.location = '../option.html';
      // if (Config.isAndroidAPK()) {
      //   window.location = '../android-login.html';
      // } else {
      //   window.location = '../option.html';
      // }
    }
  }

  _changeAvatar(img) {
    this.ajax({
      url: '/v1/user/avatar/',
      data: {
        access_token: this.cookie.get('token'),
        media: img
      },
      type: 'put'
    }).then(function(data) {
      data = data.data;
      var avatar = Config.getAvatarPrefix(data.url);
      $('.J_Upload').attr('src', avatar);
      new Toast('头像更新成功！');
    });
  }

  _requires() {
    new Header();
    $('header').sticky();
    if (this.isWeixin() && getUserInfoWX()) {
      $('.syncWrapper').show();
      new SyncInfo({
        el: $('.syncWrapper')
      });
    }else{
      $('.syncWrapper').remove();
    }
  }

  _getData() {
    return this.ajax({
      url: '/v1/user/profile/permission/data',
      data: {
        invite_code: this.cookie.get('inviteCode'),
        access_token: this.cookie.get('token') || ''
      }
    }).then((data) => {
      return data.data.permission;
    });
  }

  _getAuth() {
    this._getData().then((permission) => {
      if (permission) {
        $('.radio-wrapper', '.item.data').removeClass('off');
      }
    });
    this._getOrder().then((permission) => {
      permission && $('.radio-wrapper', '.item.order').removeClass('off');
    });
    this._getHistory().then((permission) => {
      permission && $('.radio-wrapper', '.item.history').removeClass('off');
    });

    this._getQuan().then((permission) => {
      permission && $('.radio-wrapper', '.item.quan').removeClass('off');
    });
  }

  _setQuan(e) {
    var curEl = $(e.currentTarget);
    if (curEl.attr('data-permission') == 1) {
      return
    }
    curEl.attr('data-permission', 1);

    var permission = curEl.hasClass('off') ? 1 : 0;
    this.ajax({
      url: '/v1/user/profile/permission/allow_following',
      data: {
        access_token: this.cookie.get('token'),
        permission: permission,
        invite_code: this.cookie.get('inviteCode')
      },
      type: 'post'
    }).then(() => {
      curEl.toggleClass('off');
      curEl.attr('data-permission', 0);
    });
  }

  _setData(e) {
    var curEl = $(e.currentTarget);
    if (curEl.attr('data-permission') == 1) {
      return
    }
    curEl.attr('data-permission', 1);
    var permission = curEl.hasClass('off') ? 1 : 0;
    this.ajax({
      url: '/v1/user/profile/permission/data',
      data: {
        access_token: this.cookie.get('token'),
        permission: permission,
        invite_code: this.cookie.get('inviteCode')
      },
      type: 'post'
    }).then(() => {
      curEl.toggleClass('off');
      curEl.attr('data-permission', 0);
    });
  }

  _setOrder(e) {
    var curEl = $(e.currentTarget);
    if (curEl.attr('data-permission') == 1) {
      return
    }
    curEl.attr('data-permission', 1);

    var permission = curEl.hasClass('off') ? 1 : 0;
    this.ajax({
      url: '/v1/user/profile/permission/current_order',
      data: {
        access_token: this.cookie.get('token'),
        permission: permission,
        invite_code: this.cookie.get('inviteCode')
      },
      type: 'post'
    }).then(() => {
      curEl.toggleClass('off');
      curEl.attr('data-permission', 0);
    });
  }

  _setHistory(e) {
    var curEl = $(e.currentTarget);
    if (curEl.attr('data-permission') == 1) {
      return
    }
    curEl.attr('data-permission', 1);
    var permission = curEl.hasClass('off') ? 1 : 0;
    this.ajax({
      url: '/v1/user/profile/permission/history_order',
      data: {
        access_token: this.cookie.get('token'),
        permission: permission,
        invite_code: this.cookie.get('inviteCode')
      },
      type: 'post'
    }).then(() => {
      curEl.toggleClass('off');
      curEl.attr('data-permission', 0);
    });
  }

  _getOrder() {
    return this.ajax({
      url: '/v1/user/profile/permission/current_order',
      data: {
        invite_code: this.cookie.get('inviteCode'),
        access_token: this.cookie.get('token') || ''
      }
    }).then((data) => {
      return data.data.permission;
    });
  }

  _getHistory() {
    return this.ajax({
      url: '/v1/user/profile/permission/history_order',
      data: {
        invite_code: this.cookie.get('inviteCode'),
        access_token: this.cookie.get('token') || ''
      }
    }).then((data) => {
      return data.data.permission;
    });
  }

  _getQuan() {
    return this.ajax({
      url: '/v1/user/profile/permission/allow_following',
      data: {
        invite_code: this.cookie.get('inviteCode'),
        access_token: this.cookie.get('token') || ''
      }
    }).then((data) => {
      return data.data.permission;
    });
  }

  _initAttrs() {
    var urlParams = new Uri().getParams();
    var linkUrl = urlParams.from;
    if (linkUrl) {
      $('.go-back').attr('href', linkUrl);
    }
  }
}

new Profile();