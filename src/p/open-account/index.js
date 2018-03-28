"use strict";

var Base = require('../../app/base');
var Uri = require('../../app/uri');
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
        this._initAttrs();
        this._getUserInfo();
        this._renderBankList();
        this.configStatistics();
        this.onlyOne = true;
    },

    _bind: function() {
        var doc = $(document);

        doc.on('change', '.upload-input', $.proxy(this._preview, this));
        doc.on('blur', '.J_UserPhone', $.proxy(this._vaildateUserPhone, this))
        doc.on('blur', '.J_UserName', $.proxy(this._vaildateUserName, this));
        doc.on('blur', '.J_UserIdNo', $.proxy(this._vaildateUserId, this));
        doc.on('blur', '.J_AccountName', $.proxy(this._vaildateAccountNameName, this));
        doc.on('blur', '.J_AccountBankNo', $.proxy(this._vaildateBankId, this));
        doc.on('blur', '.J_OpenName', $.proxy(this._vaildateOpenName, this));
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

    _vaildateOpenName: function(e) {
        var curEl = $(e.currentTarget);
        this._validate(curEl, 'empty');
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
        
        var els = ['.J_UserPhone', '.J_UserName', '.J_UserIdNo', '.J_AccountName', '.J_AccountBankNo', '.J_OpenName', '.J_ImgWrapper'];
        var types = ['empty', 'empty', 'cardId', 'empty',  'bankId', 'empty', 'img'];
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
        if (!this.onlyOne) {
            return;
        }

        if (!this._validates()) {
          return;
        }
        
        var params = this._getParams();

        this._showLoad(curEl);

        this.onlyOne = false;
        this.ajax({
            url: '/v1/deposit/user/info/',
            data: params,
            type: 'POST'
        }).then((data) => {
            this.onlyOne = true;
            this._hideLoad(curEl);
            this.cookie.set('is_open_account', 1, {
		        expires: Infinity
		    });
            setTimeout(() => {
                location.href = this.src;
            }, 1000);
        }, () => {
            this.onlyOne = true;
            this._hideLoad(curEl);
        })
    },

    _renderBankList: function() {
        this._getSupportBanks().then((list) => {
            this.renderTo(this.tmpl, list, $('.J_BankList'));
        })
    },

    _getSupportBanks: function() {
        return this.ajax({
            url: '/v1/user/real/withdraw/bank_list/',
            data: {
                access_token: this.cookie.get('token')
            }
        }).then((data) => {
            return data.data;
        })
    },

    _getUserInfo: function() {
        this.ajax({
            url: '/v1/deposit/user/info/true/',
            data: {
                access_token: this.cookie.get('token')
            }
        }).then((data) => {
            data = data.data;
            if (data == '未找到信息') {
                $('.J_UserPhone').val(this.cookie.get('phone'));
                $('.J_UserName').prop('disabled', false);
            } else {
                $('.J_UserPhone').val(data.phone);
                $('.J_UserName').val(data.true_name);
            }
        })
    },

    _getParams: function() {
        var phoneEl = $('.J_UserPhone'),
            nameEl = $('.J_UserName'),
            idNoEl = $('.J_UserIdNo'),
            idFrontEl = $('#J_IdFront'),
            idReverEl = $('#J_IdRever'),
            accountNameEl = $('.J_AccountName'),
            accountBankNoEl = $('.J_AccountBankNo'),
            bankNameEl = $('.J_BankList'),
            openNameEl = $('.J_OpenName'),
            bankFrontEl = $('#J_BankFront'),
            bankReverEl = $('#J_BankRever');

        return {
            access_token: this.cookie.get('token'),
            phone: phoneEl.val(),
            true_name: nameEl.val(),
            id_type: 0,
            id_no: idNoEl.val(),
            withdraw_card_user_name: accountNameEl.val(),
            withdraw_card_bank: bankNameEl.val(),
            withdraw_card_no: accountBankNoEl.val(),
            withdraw_card_bank_branch: openNameEl.val(),
            id_front: $('.img', idFrontEl).attr('src'),
            id_back: $('.img', idReverEl).attr('src'),
            withdraw_card_front: $('.img', bankFrontEl).attr('src'),
            withdraw_card_back:$('.img', bankReverEl).attr('src')
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
        curEl.append('<span>处理中<span class="dialog-load"></span></span>');
    },

    _hideLoad: function() {
        $('span', this.loadEl).remove();
    },

    _requires: function() {

    },

    _initAttrs: function() {
        this.src = new Uri().getParam('src');

        this.src = this.src || './' + getHomeUrl();

        $('.go-back').attr('href', this.src);
    },

    attrs: {
        tmpl: [
            '<% data.forEach(function(item) { %>',
                '<option data-code="<%= item.code_name %>" value="<%= item.name %>"><%= item.name %></option>',
            '<% }) %>'
        ].join('')
    }
});

new OpenAccount();