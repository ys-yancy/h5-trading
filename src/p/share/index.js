"use strict";

var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var WeiXin = require('../../app/weixin');
var Uri = require('../../app/uri');
var Dialog = require('../../common/dialog');
var Config = require('../../app/config');
var Sticky = require('../../common/sticky');
var Util = require('../../app/util');
var Banner = require('./banner');
require('../my/common/header');

function Share() {
  Share.superclass.constructor.apply(this, arguments);
  
  this.getToken().then(() => {
    this.init();
    new Banner();
  });
}

Base.extend(Share, PageBase, {
  init: function() {
    this._initAttrs();
    this._bind();
    this._getData();
    this._requires();
    this._initQrDialog();
    this.configStatistics();
  },

  _bind: function() {
    var doc = $(document);

    doc.on('tap', '#J_Share', $.proxy(this._showQRCode, this));
    doc.on('tap', '#J_QRClose', $.proxy(this._closeQrDialg, this));
  },

  _closeQrDialg: function() {
    this.qrDialog.hide();
  },

  _createQrcode: function(text, typeNumber, errorCorrectLevel) {

    var qr = qrcode(typeNumber || 8, errorCorrectLevel || 'M');
    qr.addData(text);
    qr.make();

    var w = parseInt(document.body.clientWidth / 55 / 1.6);
    return qr.createImgTag(w, w);
  },

  _createQrImgae: function(el) {
    var self = this;
    return new Promise(function(resolve, reject) {
      var imgEl = $(el),
        imgUrl = imgEl.prop('src');

      var image = new Image();

      image.onload = function() {
        var canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        canvas.getContext("2d").drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      }

      image.src = imgUrl;

    })
  },

  _showQRCode: function() {
    this.qrDialog.show();

    var txtOneEl = $('.qr-text-one'),
      txtTwoEl = $('.qr-text-two');

    var text = this.nickName ? '接受 ' + this.nickName + ' 邀请' : '接受邀请';
    txtOneEl.text(text);
    txtTwoEl.text('立即注册 ' + getWLName());

    this._createQrImgae(this._createQrcode(this._getShareUrl(), 8, 'Q')).then(function(url) {
      $('#QR2').attr('src',url);
      $('#QR1').attr('src',url);
    })
  },

  _getData: function() {
    var self = this;
    var inviteCode = this.cookie.get('inviteCode');
    $('.code').text(inviteCode);

    this.getAccount().then(function(account) {
      self.nickName = account.nickname;
      self.profileObject = self.profileObject || new Object();
      self.profileObject.avatar = account.avatar ? Config.getAvatarPrefix(account.avatar) : '';
      self.profileObject.nickName = account.nickname;
      // 在微信中
      if (self.isWeixin()) {
        self.setupWeiXinShare('invite');

        var showGuideEl = $('#J_ShowGuide'),
          infoEl = $('#J_Info');
        // showGuideEl.html('通过微信邀请朋友');

        // 通过微信邀请好友按钮
        showGuideEl.on('tap', (e) => { 
          infoEl.show();
        });

        infoEl.on('tap', $.proxy(function() {
          infoEl.hide();
        }, self));
      }
      // 在Android中
      else if (Config.isAndroidAPK()) {
        // $('#J_ShowGuide')[0].innerHTML = '通过微信邀请朋友';

        var link,
          linkIndex = getWXInviteUrlAodWL().indexOf('/i/');

        var title = getWXInviteTitleWL();
        var desc = getWXInviteDesWL();
        var imgUrl = getWXInviteImgUrlWl();

        link = getWXInviteUrlAodWL() + Cookie.get('inviteCode');

        if(title.indexOf('%s') != -1 && account && account.nickname) {
          title = title.replace(/%s/, account.nickname);
          imgUrl = account.avatar || imgUrl;
        }

        var l = 'invhero-android:recommend?title=' + encodeURIComponent(title) + '&desc=' + encodeURIComponent(desc) + '&imgUrl=' + encodeURIComponent(imgUrl) + '&link=' + encodeURIComponent(link);

        $('#J_ShowGuide')[0].href = l;

      } else {
         // $('#J_ShowGuide')[0].innerHTML = '请让好友输入以上邀请码';
      }
    })
  },

  _getShareUrl: function() {
    var url = getWXInviteUrlWL() + Cookie.get('inviteCode') + '&source=qrcode';

    if ( getIsNewShareWl() ) {
      url = getNewShareWl() + Cookie.get('uid');
    }

    return url;
  },

  _initQrDialog: function() {
    this.qrDialog = new Dialog({
      isShow: false,
      tmpl: this.qrTmpl
    });
  },

  _requires: function() {
    $('header').sticky();
  },

  _initAttrs: function() {
    var src = new Uri().getParam('src');

    if (src) {
      $('#J_GoBack').attr('href', src).show();
    }

    $('#J_Qrcode').text(this.cookie.get('inviteCode'));
  },

  attrs: {
    qrTmpl: [
      '<div style="position:fixed;top:0;text-align:center;width:100%;z-index:1000;">',
      '   <p class="qr-text-one"></p>',
      '   <p class="qr-text-two"></p>',
      '   <div id="qrcode" style="margin-bottom:20px;"><img class="qr-mask" id="QR1" src="" width="472" height="472" ><img class="qr-inner" id="QR2" src="" width="472" height="472" ></div>',
      '   <span style="color:#fff;">扫描二维码 注册领赠金</span>',
      '   <div class="qrcode-close" id="J_QRClose">关闭</div>',
      '</div>',
      '<div class="dialog-mask J_DialogMask"></div>'
    ].join('')
  }

});

new Share();