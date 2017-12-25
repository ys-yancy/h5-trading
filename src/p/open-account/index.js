"use strict";

var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var Toast = require('../../common/toast');
var Sticky = require('../../common/sticky');
var validateIdCard = require('../../lib/validate-idcard');

function OpenAccount() {
    OpenAccount.superclass.constructor.apply(this, arguments);
    this._init();
}

Base.extend(OpenAccount, PageBase, {
    _init: function() {
        this._bind();
        this._requires();
        this.configStatistics();
    },

    _bind: function() {
        var doc = $(document);

        doc.on('change', '.upload-input', $.proxy(this._preview, this));
        doc.on('blur', '.J_UserPhone', $.proxy(this._vaildateUserPhone, this))
        doc.on('blur', '.J_UserName', $.proxy(this._vaildateUserName, this));
        doc.on('blur', '.J_UserIdNo', $.proxy(this._vaildateUserId, this));
        doc.on('blur', '.J_AccountName', $.proxy(this._vaildateAccountNameName, this));
        doc.on('blur', '.J_AccountBankNo', $.proxy(this._vaildateBankId, this));

        doc.on('tap', '.J_Submit', $.proxy(this._submit, this));

        // 添加默认微信分享
        if (this.isWeixin()) {
            this.setupWeiXinShare('default_invite');
        }
    },

    _vaildateUserPhone: function(e) {
        var curEl = $(e.currentTarget);

        this._validate(curEl, 'empty');
    },

    _vaildateUserName: function(e) {
        var curEl = $(e.currentTarget);

        this._validate(curEl, 'empty');
    },

    _vaildateUserId: function(e) {
        var curEl = $(e.currentTarget);

        this._validate(curEl, 'cardId');
    },

    _vaildateAccountNameName: function(e) {
        var curEl = $(e.currentTarget);

        this._validate(curEl, 'empty');
    },

    _vaildateBankId: function(e) {
        var curEl = $(e.currentTarget);

        this._validate(curEl, 'bankId');
    },

    _validate: function(curEl, type) {
        var val = curEl.val(),
          val = val && val.trim();
    
        if (type === 'empty') {
          if (!val) {
            this._showError(curEl, '不能为空');
            return;
          }
        }

        if (type === 'cardId') {
          if (!val) {
            this._showError(curEl, '不能为空');
            return;
          }
           else if (!validateIdCard(val)) {
            this._showError(curEl, '身份证号码错误');
            return;
          }
        }
    
        /**
         * 1|允许出金条件修改为：卡号位数等于16位、18位、19位允许出金。
         * 2、卡号位数为15位、16位时，卡号前四位是6225、4514、4392、4367、5187、5236、5218、5194、5123、3568则判断为信用卡，
         * 输入框下方文案提示“十分抱歉！暂时不支持出金到信用卡”。
         */
    
        if (type === 'bankId') {
          if (!val) {
            this._showError(curEl, '不能为空');
            return;
          } else if (!/^\d{19}$/.test(val) && !/^\d{18}$/.test(val)) {
            var msg = '银行卡号错误';
    
            if ((/^\d{16}$/.test(val) || /^\d{15}$/.test(val)) && /^(6225)|(4514)|(4392)|(4367)|(5187)|(5236)|(5218)|(5194)|(5123)|(3568)/.test(val)) {
              msg = '十分抱歉！暂时不支持出金到信用卡'
            } else if (/^\d{16}$/.test(val)) {
              this._hideError(curEl);
              return true;
            }
    
            this._showError(curEl, msg);
            return;
          }
        }
    
        if (type === 'img') {
          if ($('img', curEl).length === 0) {
            this._showError(curEl, '您还没上传照片');
            return;
          }
        }
    
        this._hideError(curEl);
        return true;
    },

    _validates: function() {
        var self = this;
        
        var els = ['.J_UserPhone', '.J_UserName', '.J_UserIdNo', '.J_AccountName', '.J_AccountBankNo', '.J_ImgWrapper'];
        var types = ['empty', 'empty', 'cardId', 'empty',  'bankId', 'img'];
        var pass = true;
    
        for (var i = 0, len = els.length; i < len; i++) {
          var el = $(els[i]);
          $.each(el, function(index, item) {
            item = $(item);
    
            if (item.hasClass('J_BankId')) {
    
              if (!self.newBank) {
                if (index === 1) {
                  return;
                }
              }
            }
    
            var result = self._validate(item, types[i]);
    
            if (!result) {
              pass = false;
            }
          });
        }
    
        return pass;
    },

    _submit: function(e) {
        var self = this;
        var curEl = $(e.currentTarget);
        if (!this._validates()) {
          return;
        }
        console.log(this._validates())

        this._showLoad(curEl);
        if (this.onlyOne) {

        }
    },

    _getParams: function() {
        return {

        }
    },

    _preview: function(e) {
        var self = this;
        var preivewEl = $(e.currentTarget).siblings('.preview');

        // resize and serial image
        var file = e.currentTarget.files[0];

        // Ensure it's an image
        if(file.type.match(/image.*/)) {
            console.log('An image has been loaded');

            // Load the image
            var reader = new FileReader();
            reader.onload = function (readerEvent) {

                console.log('origin image length = ' + reader.result.length);
                var image = new Image();
                image.onload = function (imageEvent) {

                    // Resize the image
                    var canvas = document.createElement('canvas'),
                        max_size = 750,// TODO : pull max size from a site config
                        width = image.width,
                        height = image.height;
                    if (width > height) {
                        if (width > max_size) {
                            height *= max_size / width;
                            width = max_size;
                        }
                    } else {
                        if (height > max_size) {
                            width *= max_size / height;
                            height = max_size;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d').drawImage(image, 0, 0, width, height);
                    
                    var dataUrl = canvas.toDataURL('image/jpeg');

                    console.log('resized image length = ' + dataUrl.length);

                    var resizedImage = self._dataURLToBlob(dataUrl);
                    preivewEl.html('<img class="img" src="' + dataUrl + '">');
                    self._hideError(preivewEl);
                }
                image.src = readerEvent.target.result;
            }
            reader.readAsDataURL(file);
        }
    },

    _dataURLToBlob: function(dataURL) {
        var BASE64_MARKER = ';base64,';
        if (dataURL.indexOf(BASE64_MARKER) == -1) {
            var parts = dataURL.split(',');
            var contentType = parts[0].split(':')[1];
            var raw = parts[1];

            return new Blob([raw], {type: contentType});
        }

        var parts = dataURL.split(BASE64_MARKER);
        var contentType = parts[0].split(':')[1];
        var raw = window.atob(parts[1]);
        var rawLength = raw.length;

        var uInt8Array = new Uint8Array(rawLength);

        for (var i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }

        return new Blob([uInt8Array], {type: contentType});
    },

    _showError: function(curEl, message) {
        var parent = $(curEl.parents('li')[0]);
        var messageEl = curEl.siblings('.err');
    
        if (messageEl.length === 0) {
          curEl.after('<p class="err">' + message + '</p>');
        } else {
          messageEl.text(message);
          messageEl.show();
        }
        parent.addClass('error');
    },
    
    _hideError: function(curEl) {
        var parent = $(curEl.parents('li')[0]);
        var messageEl = curEl.siblings('.err');
    
        parent.removeClass('error');
        messageEl.hide();
    },

    _showLoad: function(curEl) {
        this.loadEl = curEl;
    
        var txt = curEl.text();
        curEl.attr('data-name', txt);
        curEl.html('<span>处理中<span class="dialog-load"></span></span>');
    },

    _requires: function() {

    },

    _initAttrs: function() {

    }
});

new OpenAccount();