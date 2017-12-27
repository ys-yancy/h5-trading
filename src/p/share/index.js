"use strict";

var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var WeiXin = require('../../app/weixin');
var Toast = require('../../common/toast');
var Uri = require('../../app/uri');
var Dialog = require('../../common/dialog');
var Config = require('../../app/config');
var Sticky = require('../../common/sticky');
var Util = require('../../app/util');
var CustomerService = require('../../common/customer-service');
var tmpl = require('./index.ejs');
var dialogTmpl = require('./dialog.ejs');
var exchargeTmpl = require('./excharge.ejs');
var dialogErrorTmpl = require('./dialog-error.ejs');
require('../my/common/header');

var Banner = require('./banner');

function Share() {
  Share.superclass.constructor.apply(this, arguments);

  var self = this;
  this.getToken().then(() => {
    this.init();
    new Banner();
  });
}

Base.extend(Share, PageBase, {
  init: function() {
    var doc = $(document);

    this._initAttrs();

    this._getData();
    this._requires();
    this.configStatistics();
    this.qrDialog = new Dialog({
      isShow: false,
      tmpl: this.qrTmpl
    });
    this._showQRCode();
    this.qrDialog.hide();
    this._showQRCode();
    this.qrDialog.hide();
    $('.J_DialogMask').on('touchmove', $.proxy(this._preventTouch, this));
    //doc.on('tap', '#J_QRCode', $.proxy(this._showQRCode, this));
    doc.on('tap', '#J_QRClose', $.proxy(function() {
      this.qrDialog.hide();
    }, this));

    // $('#J_Invite').on('submit', $.proxy(this._invite, this));


    var self = this;
    this.ajax({
        url: '/v1/user/profile/info',
        data: {
          invite_code: Cookie.get('inviteCode')
        },
        type: 'get'
      }).then((data) => {
        self.nickName = data.data.nick_name;
      }, (data) => {
    });


    // 在微信中
    if (this.isWeixin()) {
      
      var url = location.href;

      this.getAccount().then(function(account) {
        if (! self.profileObject) {
          self.profileObject = new Object ();
        }
        self.profileObject.avatar = account.avatar ? Config.getAvatarPrefix(account.avatar) : '';
        self.profileObject.nickname = account.nickname;
        self.setupWeiXinShare('invite');
      });

      var url = location.href.replace('share', 'activity/festival');
      var params = 'inviteCode=' + this.cookie.get('inviteCode');
      if (url.indexOf('?') !== -1) {
        url += '&' + params;
      } else {
        url += '?' + params;
      }

      $('#J_ShowGuide')[0].innerHTML = '通过微信邀请朋友';


      // 通过微信邀请好友按钮
      doc.on('tap', '#J_ShowGuide', (e) => { 
        $('#J_Info').show();
      });

      // $('#J_Info').css('display', 'block');
      // $('#J_ShareText').remove();
      doc.on('tap', '#J_Info', $.proxy(function() {
        $('#J_Info').css('display', 'none');
      }, this));
      // $('.content').css('padding-top', '0');
      doc.on('tap', '#J_Share', $.proxy(function() {
        this._showQRCode();
        this.qrDialog.hide();
        this._showQRCode();
      }, this));
    }
    // 在Android客户端里
    else if (Config.isAndroidAPK()) {
      $('#J_ShowGuide')[0].innerHTML = '通过微信邀请朋友';
      $('#J_Banner').remove();

      doc.on('tap', '#J_Share', $.proxy(function() {
        this._showQRCode();
        this.qrDialog.hide();
        this._showQRCode();
      }, this));


      // this.ajax({ 
      //   url: '/v1/config/wxshare',
      //   data: {
      //   },
      //   type: 'get'
      // }).then((data) => {
      //   var d = data.data;
        self.getAccount().then(function(account) {

          // var title = d.inviteTitle;
          // var desc = d.description;
          // var imgUrl = d.imgUrl;
          // var link = d.inviteLink + Cookie.get('inviteCode');

          var link,linkIndex = getWXInviteUrlAodWL().indexOf('/i/');
          var title = getWXInviteTitleWL();
          var desc = getWXInviteDesWL();
          var imgUrl = getWXInviteImgUrlWl();

          link = getWXInviteUrlAodWL() + Cookie.get('inviteCode');

          if(title.indexOf('%s') != -1 && account && account.nickname) {
            title = title.replace(/%s/, account.nickname);
            imgUrl = account.avatar || imgUrl;
          }

          var l = 'invhero-android:recommend?title=' + encodeURIComponent(title) + '&desc=' + encodeURIComponent(desc) + '&imgUrl=' + encodeURIComponent(imgUrl) + '&link=' + encodeURIComponent(link);

          // 调整按钮的分享链接
          // $('#J_Share')[0].innerHTML = '分享邀请链接';
          $('#J_ShowGuide')[0].href = l;
        });
        

      // }, (data) => {
      // });
    }
    // 在网页里打开
    else {
      // $('#J_ShowGuide')[0].href=''; 
      $('#J_ShowGuide')[0].innerHTML = '请让好友输入以上邀请码';
      // 按钮显示二维码
      doc.on('tap', '#J_Share', $.proxy(function() {
        this._showQRCode();
        this.qrDialog.hide();
        this._showQRCode();
      }, this));
    }

    // 如果是Android内置webview就不显示下载条和抽奖入口
    if (!Config.isAndroidAPK() && getIfShowDLinkWL()) {
            // $('.my-lootery').parent().remove();
            // $('#J_Banner').remove();
        $('.footer').append('<div class="bottom-banner" id="J_Banner">\
              <span class="desc">朋友赚入账通知请登录APP</span>\
              <a class="login J_Login" href="http://a.app.qq.com/o/simple.jsp?pkgname=com.invhero.android">下载APP</a>\
          </div>');
    }

    if (window.location.href.indexOf('from=androidApp') != -1) {
      $('#J_Banner').hide();
    }

  },

  _invite: function(e) {
    e.preventDefault();

    var code = $('#J_Code').val();

    if (!code) {
      return;
    }

    if (code === this.cookie.get('inviteCode')) {
      // this._showDialog('fail', 'self'); <p></p>
      this._showDialogError('不能使用自己的邀请码<br/>让朋友邀请你或者去邀请朋友吧')
      return;
    }

    if (code.length >= 7) {
      this.ajax({
        url: '/v1/user/promocode/',
        data: {
          access_token: this.cookie.get('token'),
          code: code
        },
        type: 'post',
        hideError: true
      }).then((data) => {
        data = data.data;

        new Dialog({
          isShow: true,
          tmpl: this.render(exchargeTmpl, {
            status: 200,
            amount: data.amount
          }),
          confirmCallback: function() {
            this.hide();
            this.destroy();
          }
        });


      }, (data) => {
        if (data.status === 404) {
          new Dialog({
            isShow: true,
            tmpl: this.render(exchargeTmpl, {
              status: data.status
            }),
            confirmCallback: function() {
              this.hide();
              this.destroy();
            }
          });
        } else if (data.status === 407) {
          this._showDialogError('您无法重复使用此兑换码！');
        }

        if (data.status === 406 || data.status === 405) {
          new Dialog({
            isShow: true,
            tmpl: this.render(exchargeTmpl, {
              status: data.status
            }),
            confirmCallback: function() {
              this.hide();
              this.destroy();
            }
          });
        }
      })

      return;
    }

    this.ajax({
      url: '/v1/user/refer',
      data: {
        access_token: this.cookie.get('token'),
        invite_code: code
      },
      type: 'post'
    }).then((data) => {
      //new Toast('输入成功');
      this._showDialog('success');
    }, (data) => {
      if (data.message === "无效的邀请码") {
        // this._showDialog('error');
        this._showDialogError('无效的邀请码！<br/>请填写正确的邀请码后重试')
      } else {
        this._showDialog('fail');
      }
      //new Toast(data.message);
    });
  },

  _preventTouch: function(e) {
    e.preventDefault();
  },

  _createQrcode: function(text, typeNumber, errorCorrectLevel) {

    var qr = qrcode(typeNumber || 8, errorCorrectLevel || 'M');
    qr.addData(text);
    qr.make();

    var w = parseInt(document.body.clientWidth / 55 / 1.6);
    // return qr.createImgTag(100, 100, 1, '测试二维码');
    return qr.createImgTag(w, w);
  },

  _showQRCode: function() {
      function gifToJpeg(string) {
        var div = document.createElement("div");
        div.innerHTML = string;
        var image = $(div).children()[0];
        var canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        canvas.getContext("2d").drawImage(image, 0, 0);
        var image = new Image();
        //这里的image后面可以写png，jpeg，但是不能写jpg，jpeg转化后8k,png转化后15k
        image.src = canvas.toDataURL("image/png");
        return image;
      }

      var url = getWXInviteUrlWL() + Cookie.get('inviteCode') + '&source=qrcode';

      if ( getIsNewShareWl() ) {
        url = getNewShareWl() + Cookie.get('uid');
      }

      var ele = gifToJpeg(this._createQrcode(url, 8, 'Q'));
      $('#J_Info').hide();
      this.qrDialog.show();
      $('#QR2').attr('src',ele.src);
      $('#QR1').attr('src',ele.src);
      if (this.nickName) {
        $('.qrtext_1').text('接受 ' + this.nickName + ' 邀请');
      } else {
        $('.qrtext_1').text('接受邀请');
      }
      $('.qrtext_2').text('立即注册 ' + getWLName());
  },


  _getData: function() {
    var self = this;

    var inviteCode = this.cookie.get('inviteCode');
    /*
    var val = this.render(tmpl, {
      inviteCode: inviteCode
    });
    */

    $('.code').text(inviteCode);
  },

  _requires: function() {
    // new CustomerService();

    $('header').sticky();
  },

  _initAttrs: function() {
    var src = new Uri().getParam('src');

    if (src) {
      $('#J_GoBack').attr('href', src).show();
    }

    $('#J_Qrcode').text(this.cookie.get('inviteCode'));
  },

  _showDialog: function(type, self) {
    var data = {};
    if (type === 'fail') {
      data.fail = true;

      if (self) {
        data.self = true
      }
    } else if (type === 'success') {
      data.success = true;
    } else {
      data.error = true;
    }
    var dialog = new Dialog({
      isShow: true,
      tmpl: this.render(dialogTmpl, data),
      confirmCallback: function() {
        this.hide();
        this.destroy();
      }
    });

    var innerEl = $('.dialog-inner', dialog.el);

    var height = innerEl.height(),
      winHeight = $(window).height();

    // if (winHeight > height) {
    //     innerEl.css('top', (winHeight - height) / 2);
    // }
  },

  _showDialogError: function(msg) {
    var self = this;

    this.dialog = new Dialog({
      isShow: true,
      tmpl: this.render(dialogErrorTmpl, {
        msg: msg
      }),
      cancleCallback: function() {
        this.destroy();
      }
    });
  },

  attrs: {

    qrTmpl: [
      '<div style="position:fixed;top:5rem;;text-align:center;width:100%;z-index:102;">',
      '   <p class="qrtext_1"></p>',
      '   <p class="qrtext_2"></p>',
      '   <div id="qrcode" style="margin-bottom:20px;"><img id="QR1" src="" width="472" height="472" ><img id="QR2" src="" width="472" height="472" ></div>',
      '   <span style="color:#fff;">扫描二维码 注册领赠金</span>',
      '   <div class="qrcode_close" id="J_QRClose">关闭</div>',
      '</div>',
      '<div class="dialog-mask J_DialogMask"></div>'
    ].join('')
  }


});

new Share();