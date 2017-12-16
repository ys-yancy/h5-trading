'use strict';

require('./index.css');

var Base = require('../../../../app/base');
var Dialog = require('../../../../common/dialog');
var Cookie = require('../../../../lib/cookie');
var Toast = require('../../../../common/toast');
var QrCode = require('../../../../lib/qrcode');
var tmpl = require('./index.ejs');

export default class UsQrCode extends Base {
  constructor(config) {
    super(config);

    this._bind();

    this.checkRe = false;
    this.onlyOne = true;
  }

  _bind() {
    var doc = $(document);

    doc.on('tap', '.J_ShowSelfQrCode', $.proxy(this.showDialog, this));

  }

  _lazyBind() {
    var self = this;
    this.maskEl = $('#J_USQrCodeMask');
    this.dialogWrapEl = $('.selfQrCode-dialog');
    
    this.maskEl.on('click', function() {
      self._destroy();
    })
    this.dialogWrapEl.on('touchmove', function(e) {
      e.preventDefault();
    });
  }

  showDialog() {
    this.dialog = new Dialog({
      isShow: true,
      tmpl: this.render(tmpl, {
        avatar: this.avatar,
        name: this.name
      })
    });
    this._lazyBind();
    this.loadQrcode();
  }

  _destroy() {
    this.maskEl.off('click', function() {
      self._destroy();
    })
    this.dialogWrapEl.off('touchmove', function(e) {
      e.preventDefault();
    });
    this.maskEl.remove();
    this.dialog.destroy();
  }

  _renderQr(el) {
    var imgEl = $(el),
      imgUrl = imgEl.prop('src'),
      wrapEl = $('#J_UsQrcodeWrap');
    var image = new Image();
    image.className = 'us-qr-img';
    image.onload = function() {
      var canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 400;
      canvas.getContext("2d").drawImage(image, 0, 0);
      wrapEl.html($('<img class="us-qr-img"/>').prop('src', canvas.toDataURL("image/png")));
    }
    image.src = imgUrl;
  }

  loadQrcode() {
    var url = getWXInviteUrlWL() + Cookie.get('inviteCode') + '&source=qrcode';

    if ( getIsNewShareWl() ) {
      url = getNewShareWl() + Cookie.get('uid');
    }
    var imgEl = this._createQrcode(url, 8, 'Q');
    this._renderQr(imgEl);
  }

  _createQrcode(text, typeNumber, errorCorrectLevel) {
    var qr = QrCode(typeNumber || 8, errorCorrectLevel || 'M');
    qr.addData(text);
    qr.make();

    var w = parseInt(document.body.clientWidth / 55 / 1.6);
    return qr.createImgTag(w, w);
  }
}