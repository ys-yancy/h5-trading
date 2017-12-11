"use strict";

var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var Toast = require('../../common/toast');
var Sticky = require('../../common/sticky');
var Dialog = require('../../common/dialog');
var validateIdCard = require('../../lib/validate-idcard');
var CustomerService = require('../../common/customer-service');
var tmpl = require('./index.ejs');
var Config = require('../../app/config');
var dialogTmpl = require('./dialog.ejs');

function Extract() {
  Extract.superclass.constructor.apply(this, arguments);
  var self = this;
  this.login().then(function() {
    self.init();
  }, function() {
    location.href = './my.html';
  });
}

Base.extend(Extract, PageBase, {
  init: function() {
    this._bind();
    this._requires();
    
    this._getData();
    this.configStatistics();
    this.onlyOne = false;
    this._getServicePhone();
  },

  _bind: function() {
    var doc = $(document);

    doc.on('change', '.upload-input', $.proxy(this._preview, this));

    doc.on('blur', '.J_CardName', $.proxy(this._vaildateCardName, this));
    doc.on('blur', '.J_CardId', $.proxy(this._vaildateCardId, this));
    doc.on('blur', '.J_BankId', $.proxy(this._vaildateBankId, this));
    // doc.on('change', '.J_BankId', $.proxy(this._vaildateBankId, this));
    doc.on('blur', '.J_ExtractNum', $.proxy(this._validateNum, this));
    doc.on('tap', '.J_Submit', $.proxy(this._submit, this));
    doc.on('change', '.J_CardSelect', $.proxy(this._cardSelect, this));

    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }
    
  },

  _vaildateCardName: function(e) {
    var curEl = $(e.currentTarget);

    this._validate(curEl, 'empty');
  },

  _vaildateCardId: function(e) {
    var curEl = $(e.currentTarget);

    this._validate(curEl, 'cardId');
  },

  _vaildateBankId: function(e) {
    var curEl = $(e.currentTarget);

    this._validate(curEl, 'bankId');
  },

  _validateNum: function(e) {
    var curEl = $(e.currentTarget);

    this._validate(curEl, 'compareTotal');
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
      //暂时处理一下
       else if ( val!='M0581927601' && !validateIdCard(val)) {
        this._showError(curEl, '身份证号码错误');
        return;
      }
    }

    /**
     * 1|允许出金条件修改为：卡号位数等于16位、18位、19位允许出金。
     * 2、卡号位数为15位、16位时，卡号前四位是6225、4514、4392、4367、5187、5236、5218、5194、5123、3568则判断为信用卡，
     * 输入框下方文案提示“十分抱歉！暂时不支持出金到信用卡”。
     */

    if (type === 'bankId' && curEl.parent().css('display') !== 'none') {
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

    if (type === 'compareTotal') {
      if (!val) {
        this._showError(curEl, '不能为空');
        return;
      } else if (!/^\d+(\.\d+)?$/.test(val)) {
        this._showError(curEl, '金额只能为数字');
        return;
      } else if (parseFloat($('.J_AvaiableNum').val() || 0) < parseFloat(val)) {
        this._showError(curEl, '出金金额应小于可提金额');
        return;
      } else if (parseFloat(val) < getMinWithdrawWL()) {
        this._showError(curEl, '出金金额应大于' + getMinWithdrawWL() + '美元');
        return;
      }
    }

    if (type === 'img' && this.newBank) {
      if ($('img', curEl).length === 0) {
        this._showError(curEl, '您还没上传照片');
        return;
      }
    }

    this._hideError(curEl);
    return true;
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

  _cardSelect: function(e) {
    var curEl = $(e.currentTarget),
      optionEl = $('option', '.J_CardSelect').not(function() {
        return !this.selected
      });

    if (optionEl.hasClass('new')) {
      $('.J_BankId').val('');
      $('#J_NewBankWrapper').show();
      $('#J_BankId').hide();
      this.newBank = true;
    } else {
      $('#J_NewBankWrapper').hide();
      var str = optionEl.html().split('(')[1].split(')')[0];
      $('.J_BankId').val(str);
      this.newBank = false;
    }
  },

  _submit: function(e) {
    var self = this;
    var curEl = $(e.currentTarget);
    if (!this._validates()) {
      return;
    }

    

    var params = this._getParams();
    if ($('.J_CardFront').length > 0 && !params.id_front){
      new Toast('请上传身份证正面照片');
      return;
    }
    if ($('.J_CardBack').length > 0 && !params.id_back){
      new Toast('请上传身份证背面照片');
      return;
    }
    console.log(('.J_CardFront').length);
    if ($('.J_CardFront').length > 0 && !params.card_front){
      new Toast('请上传出金银行卡正面照片');
      return;
    }
    if ($('.J_CardFront').length > 0 && !params.card_back){
      new Toast('请上传出金银行卡背面照片');
      return;
    }
    if ($('#J_NewBankWrapper').css('display') !== 'none' && !params.card_front){
      new Toast('请上传出金银行卡正面照片');
      return;
    }
    if ($('#J_NewBankWrapper').css('display') !== 'none' && !params.card_back){
      new Toast('请上传出金银行卡背面照片');
      return;
    }

    this._showLoad(curEl);
    if(!this.onlyOne){
      this.onlyOne = true;
      this.getRealToken().then((realToken) => {
        params = $.merge(params, {
          access_token: self.cookie.get('token'),
          real_token: realToken
        });
  
        this.ajax({
          url: '/v1/user/real/withdraw/manually/',
          data: params,
          type: 'post'
        }).then((data) => {
          //new Toast('出金成功');
          this._showDialog('success');
  
          // setTimeout(function() {
          //     location.href = './account.html';
          // }, 2000);
  
  
        }).fail((data) => {
          // new Toast('出金错误');
          this._showDialog('fail');
        });
      });
    }
  },

  _getParams: function() {
    var defaultBank = $('.J_CardSelect').val();
    if (defaultBank === 'new' || !defaultBank) {
      var bankEl = $('option', '.J_BankSelect').not(function() {
        return !this.selected
      });
    } else {
      var select = $('.J_CardSelect')[0];
      var bankEl = $(select.options[select.selectedIndex]);
    }

    var card_no = $('.J_BankId')[$('.J_BankId').length-1].value || $('.J_BankId').val() || $('#J_BankId').val()|| this.cardNo ;
    return {
      bank_name: bankEl.text(),
      bank_code: bankEl.val(),
      //card_no: this.cardNo || $('.J_BankId').val(),
      card_no: $('.J_BankId')[$('.J_BankId').length-1].value || $('.J_BankId').val() || $('#J_BankId').val()|| this.cardNo ,
      amount: $('.J_ExtractNum').val(),
      card_front: $('img', '.J_BankFront').attr('src'),
      card_back: $('img', '.J_BankBack').attr('src'),
      id_front: $('img', '.J_CardFront').attr('src'),
      id_back: $('img', '.J_CardBack').attr('src'),
      id_no: $('.J_CardId').val(),
      true_name: $('.J_CardName').val()
    }
  },

  _validates: function() {
    var self = this;
    var els = ['.J_CardName', '.J_CardId', '.J_BankId', '.J_ExtractNum', '.J_ImgWrapper'];
    var types = ['empty', 'cardId', 'bankId', 'compareTotal', 'img'];
    var pass = true;

    for (var i = 0, len = els.length; i < len; i++) {
      var el = $(els[i]);
      $.each(el, function(index, item) {
        item = $(item);
        if (item.hasClass('new') && self.newBank && i === 2) {
          return;
        }

        if (item.hasClass('J_BankId')) {

          if (!self.newBank) {
            if (index === 1) {
              return;
            }
          }
        }

        var result = self._validate(item, types[i]);
        console.log(result, types[i])

        if (!result) {
          pass = false;
        }
      });
    }

    return pass;
  },

  _getData: function() {
    var self = this;

    this.getRealToken(true).then(function(realToken) {
      return self._getWithDraw(realToken);
    });
  },

  _getWithDraw: function(realToken) {
    var self = this;

    return this.ajax({
      url: '/v1/user/real/withdraw/',
      data: {
        access_token: this.cookie.get('token'),
        real_token: realToken
      }
    }).then(function(data) {
      data = data.data;
      data.phone = self.cookie.get('phone');
      data.min_extract_amount = getMinWithdrawWL();

      self.cardNo = data.card_no;
      self.render(tmpl, data, $('#J_Content'));
      $('#J_Brand')[0].innerHTML = getWLName();
      $('#daheng')[0].innerHTML = getDaheng();
      console.log(data)
    })
  },

  _getServicePhone: function(token) {
    var self = this;
    return this.ajax({
      url: '/v1/customer_call',
      data: {
        access_token: this.cookie.get('token'),
        _r: Math.random()
      }
    }).then(function(data) {
      if (data.data.phone) {
        var h;
        if (Config.isAndroidAPK()) {
          h = 'invhero-android:call?phone=' + data.data.phone;
        }
        else {
          h = 'tel:' + data.data.phone;
        }

        if ( data.data.phone ) {
          $('.bank .desc-item').after('<li class="tips">若上传照片遇到问题，请点击页面底部400电话按钮联系客服。</li>');
          $('footer').before('<div class="phone-wrapper"><p>点击下方电话即可连线客服,我们7×24小时全力为您服务：</p><a class="J_SPhone" href=""></a></div>');
          // 设置链接
          $('.J_SPhone').attr('href', h); 
          // 设置text
          $('.J_SPhone').text(data.data.phone);
        }
      }
    });
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
                    max_size = 800,// TODO : pull max size from a site config
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
                /*
                $.event.trigger({
                    type: "imageResized",
                    blob: resizedImage,
                    url: url
                });
                */
                preivewEl.html('<img class="img" src="' + dataUrl + '">');
                self._hideError(preivewEl);
            }
            image.src = readerEvent.target.result;
            // preivewEl.html('<img class="img" src="' + readerEvent.target.result + '">');
            // self._hideError(preivewEl);
        }
        reader.readAsDataURL(file);
    }

    /*
    // if (Config.isAndroidAPK()) {
      var reader = new FileReader();
      console.log("reader: " + reader);
      reader.onloadend = function() {
        var dataUrl = reader.result;
        console.log("dataUrl.length = " + dataUrl.length);
        if (reader.error != null) {
          console.log("input_img_error reader.error.code=" + reader.error.code);
          var debug_url = 'https://p.invhero.com/debug/android/input_img_error/?error_code=' + this.error.code + "&access_token=" + Cookie.get('token');
          console.log("debug_url: " + debug_url);
          self.ajax({
            url: debug_url,
            type: 'post',
            unjoin: true,
            data: {}
          }).then(function(data) {
            console.log("input_img_error debug done.");
          });
        } else {
          console.log("input_img_ok.");
        }
        var index = 0;
        while (index + 512 < dataUrl.length) {
          var res = dataUrl.substring(index, index + 512);
          console.log(res);
          index += 512;
        }
        preivewEl.html('<img class="img" src="' + dataUrl + '">');
        self._hideError(preivewEl);
      }
      reader.readAsDataURL(e.currentTarget.files[0]);
    */
    // } else {


    //   lrz(e.currentTarget.files[0], {
    //     // 压缩开始
    //     before: function() {
    //       console.log('压缩开始');
    //     },
    //     // 压缩失败
    //     fail: function(err) {
    //       console.error(err);
    //     },
    //     // 压缩结束（不论成功失败）
    //     always: function() {
    //       console.log('压缩结束');
    //     },
    //     // 压缩成功
    //     done: function(results) {
    //       // 你需要的数据都在这里，可以以字符串的形式传送base64给服务端转存为图片。
    //       preivewEl.html('<img class="img" src="' + results.base64 + '">');

    //       self._hideError(preivewEl);
    //     }
    //   });
    // }
  },

  _showDialog: function(type) {
    var data = {};
    var callback;
    if (type === 'fail') {
      data.fail = true;
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

        if (type === 'success') {
          window.location = './account.html';
        }
      }
    });
  },

  _showLoad: function(curEl) {
    this.loadEl = curEl;

    var txt = curEl.text();
    curEl.attr('data-name', txt);
    curEl.html('<span>处理中<span class="dialog-load"></span></span>');
  },

  _requires: function() {
    // new CustomerService();
    $('header').sticky();
  }
});

new Extract();