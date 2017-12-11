(function() {
  window.Pay = {
    init: function() {
      this._bind();

    },

    _bind: function() {
      this._haveBankCardRecord();
      var creditCardFormEl = $('#creditCardForm');
      var debitCardFormEl = $('#debitCardForm');
      var recordPageEl = $('#recordPage');
      var self = this;

      [$('#validThru'), $('#CVV2Num'), $('#validThru_b'), $('#CVV2Num_b')].forEach(function(item) {
        $(item).on('focus', function(e) {
          var curEl = $(e.currentTarget);
          var parentEl = curEl.parent();

          $('.J_Tips', parentEl).show();
        });
        $(item).on('blur', function(e) {
          var curEl = $(e.currentTarget);
          var parentEl = curEl.parent();

          $('.J_Tips', parentEl).hide();
        });
      });

      $('.J_Tips').on('click', function(e) {
        $(this).hide();
      });

      $('.J_Validate', debitCardFormEl).on('blur', function(e) {
        var curEl = $(e.currentTarget);
        var validate = curEl.attr('data-validate');

        self._validate(curEl, validate);
      });

      $('.J_Validate', creditCardFormEl).on('blur', function(e) {
        var curEl = $(e.currentTarget);
        var validate = curEl.attr('data-validate');

        self._validate(curEl, validate);
      });

      $('.J_Validate', recordPageEl).on('blur', function(e) {
        var curEl = $(e.currentTarget);
        var validate = curEl.attr('data-validate');

        self._validate(curEl, validate);
      });

      var doc = $(document);

      doc.on('tap', '.J_Radio', function(e) {
        var curEl = $(e.currentTarget);

        curEl.toggleClass('active');

        if (curEl.hasClass('active')) {
          self.hideError(curEl.parent().parent())
        }
      }).on('click', '.J_ShowProtocal', function(e) {
        $('#J_Protocal').show();
      }).on('click', '.J_HideProtocal', function(e) {
        $('#J_Protocal').hide();
      })

      // 点击借记卡获取验证码
      doc.on('tap', '#getValidateCodeDebitCard', $.proxy(this._getValidateCodeDebitCardClicked, this));
      
      // 点击信用卡获取验证码
      doc.on('tap', '#getValidateCodeCreditCard', $.proxy(this._getValidateCodeCreditCardClicked, this));

      //使用新卡付款
      $('.record_bank_sec').on('change',this._newBankCordPay);

      //获取验证码
      doc.on('tap', '#getInfoCodeDebitCard', $.proxy(this._getInfoCodeDebitCardFn, this));

      //删除银行卡信息
      doc.on('tap', '#record_bank_del', $.proxy(this._delBankIfo, this));

      // $('#orderAmount').text(getCookie('kjPay_amount'));
      
    },

    _countdown: function(el) {
        var count = 60;
        el.val(count);
        el.addClass('disable');
        coundown();
        // el.prop('disabled', true);
        function coundown() {
          if (el.hasClass('disable')) {
            setTimeout(function() {
                var val = el.val();

                if (val == 0) {
                    el.val('重新获取');
                    el.removeClass('disable');
                    // el.prop('disabled', false);
                } else {
                    // if(val == '重新获取') {
                    //   return;
                    // }
                    val -= 1;
                    el.val(val);


                    coundown();
                }
            }, 1000);
          }
        }
    },

    //获取用户银行卡信息
    _haveBankCardRecord: function (e) {
      var self = this;
      var param = {
                  access_token: getCookie("token")
                  // wl: getCookie("wl"),
        }
        $.ajax({
            url : getApiServerUrlPrefix()+'/v1/user/pay/deposit_chinagpay_express/card_list/?',
            type : 'GET',
            data :$.param(param),
            unjoin: true,
            success : function ( data ) {
              if ( data.status == 200 ) {
                data = data.data;
                if ( data.length == 0 ) {
                  $('#dialog8229,#recordPage').hide();
                  $('#bank,#creditBank,#stage').show();
                  if ( !getHasCreditBank() ) {
                    $('#creditBank').hide();
                  }
                }else{
                  var realName = data[0].card_user_name.replace(/^(.)/g,'*'),
                  mobileNo = data[0].card_phone_no,
                  idNo = data[0].card_no.replace(data[0].card_no.substr(3,data[0].card_no.length-7),"****");
                  $('.record_name_cnt').text(realName);
                  $('.record_cord_cnt').text(idNo);
                  $('.record_phone_cnt').text(mobileNo);
                  if ( data[0].card_type == 'credit_card' ) {
                    $('.input-wrapper_b').show();
                  }
                  for ( var i = 0; i < data.length; i++ ) {
                      self._fillSelectBankName(data[i]);
                  }
                  $('.record_bank_sec option').eq(0).addClass('pitchUp');
                  $('<option/>').addClass('secOtherBank').html('使用新卡付款').appendTo($('.record_bank_sec'));
                  $('#bank,#creditBank,#stage,#dialog8229').hide();
                  $('#recordPage').show();
                }
              }
            }
        })
    },

    _delBankIfo: function () {
      var bankCardNo = $('.pitchUp').attr('bankCardNo'),
      param = {access_token:getCookie("token"),bankCardNo:bankCardNo};

      $.ajax({
          url : getApiServerUrlPrefix()+'/v1/user/real/deposit/bankinfo/delete/',
          type : "POST",
          data : $.param(param),
          unjoin: true,
          success : function ( data ) {
            if ( data.status == 200 ) {
                var index = $('.pitchUp').index()
                $('.record_bank_sec option').eq(0).addClass('pitchUp');
                $('.record_bank_sec option').eq( index ).remove();
                if ( $('.record_bank_sec option').length == 1 ) {
                    $('#stage,#bank,#creditBank').show();
                    if ( !getHasCreditBank() ) {
                      $('#creditBank').hide();
                    }
                    $('#recordPage').hide();
                }
            }
          }
      })
    },

    //填充select
    _fillSelectBankName: function (data) {
      var bankNodeCodeF = data.card_no.substr(data.card_no.length-4);
      console.log(bankNodeCodeF)
      var opTag = $('<option/>').attr({
          bankCardNo : data.card_no,
          bankCardType : data.card_type == 'debit_card' ? 'DR' : 'CR',
          idNo : data.card_certif_id,
          realName : data.card_user_name,
          cvv2 : data.card_cvv2 ? data.card_cvv2 : '',
          validThru : data.card_expiration ? data.card_expiration : '',
          mobileNo : data.card_phone_no,
          // bankCode : data.bankCode,
      })
      // data[0].card_no.replace(data[0].card_no.substr(3,data[0].card_no.length-7),"****");
      if ( opTag.attr('bankCardType') == 'DR' ) {
        // opTag.html(bankIfoObj[data.bankCode]+'(&nbsp;尾号'+bankNodeCodeF+'&nbsp;)').appendTo($('.record_bank_sec'))
        opTag.html(data.card_no.replace(data.card_no.substr(3,data.card_no.length-7),"****")+'(借记卡)').appendTo($('.record_bank_sec'))
      }else{
        // opTag.html(bankIfoObj[data.bankCode]+'信用卡(&nbsp;尾号'+bankNodeCodeF+'&nbsp;)').appendTo($('.record_bank_sec'))
        opTag.html(data.card_no.replace(data.card_no.substr(3,data.card_no.length-7),"****")+'(信用卡)').appendTo($('.record_bank_sec'))
      }  
    },

    //使用新卡付款
    _newBankCordPay : function () {
      $('#getInfoCodeDebitCard').removeClass('two');
      var curEl = $('.record_bank_sec option:checked');
      if ( $('.record_bank_sec').val() == '使用新卡付款' ) {
            $('#recordPage').hide();
            $('#stage,#bank,#creditBank').show();
            if ( !getHasCreditBank() ) {
              $('#creditBank').hide();
            }
            return;
        }
        $(this).find('option').removeClass('pitchUp')
        if ( curEl.attr('bankcardtype') == 'CR' ) {
          $('.input-wrapper_b').show();
        } else {
          $('.input-wrapper_b').hide();
        }
        curEl.addClass('pitchUp')
        $('.record_phone_cnt').html($('.pitchUp').attr('mobileNo'))
        $('.record_name_cnt').html($('.pitchUp').attr('realName').replace(/^(.)/g,'*'));
        $('.record_cord_cnt').html($('.pitchUp').attr('idNo').replace($('.pitchUp').attr('idNo').substr(3,$('.pitchUp').attr('idNo').length-7),"****"));
        if ( $('.record_bank_sec').val() == '使用新卡付款' ) {
            $('#recordPage').hide();
            $('#bank,#creditBank').show();
            if ( !getHasCreditBank() ) {
              $('#creditBank').hide();
            }
        }
    },

    //获取验证码（有记录的情况下）
    _getInfoCodeDebitCardFn: function (e) {
      var bankCardType = $('.pitchUp').attr('bankCardType');
      invhero_shengpay_yijian_param['bankCode'] = $('.pitchUp').attr('bankCode');
      if ( bankCardType == 'DR' ) {
          this._getValidateCodeDebitCardClicked(e);
      }else if ( bankCardType == 'CR' ) {
          this._getValidateCodeCreditCardClicked(e);
      }
    },


    // 信用卡获取验证码
    _getValidateCodeCreditCardClicked: function(e) {
      console.log("getValidateCodeCreditCardClicked");

      $('#validThru_b').blur();
      $('#validThru_b2').blur();
      $('#validThru').blur();
      $('#validThru2').blur();
      var curEl = $(e.currentTarget);

      if (curEl.hasClass('disable')) {
        return;
      }
      if ( !(curEl.attr('id') == 'getInfoCodeDebitCard') ) {
          if (!validate($('#creditCardForm'), 'code')) {
            return;
        }
      }

      this._countdown(curEl);

      var card_expiration = '';
      if ($('#validThru2').val()&&$("#validThru").val()) {

        card_expiration = $('#validThru2').val()+$("#validThru").val();

      } else if($('#validThru_b').val()&&$("#validThru_b2").val()) {

        card_expiration = $("#validThru_b2").val() + $('#validThru_b').val();
      }

      invhero_shengpay_yijian_param['card_type'] = "credit_card";
      invhero_shengpay_yijian_param['card_no'] = $("#creditNum").val()||$('.pitchUp').attr('bankCardNo');
      invhero_shengpay_yijian_param['card_user_name'] = $("#creditName").val()||$('.pitchUp').attr('realName');
      invhero_shengpay_yijian_param['card_certif_id'] = $("#creditPsnNum").val()||$('.pitchUp').attr('idNo');
      invhero_shengpay_yijian_param['card_phone_no'] = $("#creditPhNum").val()||$('.pitchUp').attr('mobileNo');
      invhero_shengpay_yijian_param['card_cvv2'] = $("#CVV2Num").val()|| $('#CVV2Num_b').val() || $('.pitchUp').attr('cvv2');
      invhero_shengpay_yijian_param['card_expiration'] = card_expiration || $('.pitchUp').attr('validThru');

      invhero_shengpay_yijian_param['access_token'] = getCookie("token");

      var p = $.extend({}, invhero_shengpay_yijian_param);
  

      var url = getApiServerUrlPrefix() + '/v1/user/pay/deposit_chinagpay_express/send_sms/?';

      if ( !curEl.hasClass('two') ) {
        curEl.addClass('two');
        $.ajax({
          type: 'post',
          url: getApiServerUrlPrefix() + '/v1/user/pay/deposit_chinagpay_express/request_pay/?',
          data: p
        }).then(function( data ) {
          request_pay_param.express_deposit_id = data.data.express_deposit_id;
          if ( data.status == 200 ) {
            // $('#orderAmount').html(data.data.amount_cny);
            Pay.showMessage("短信发送成功，请接受验证码并提交!", '支付金额为:' + data.data.amount_cny/100 + '元');
            $('#payDebitBtn,#payCreditBtn,#payCreditBtn_tt').css('backgroundColor', '#6D80A4');
          }else {
              Pay.showMessage("短信发送失败:" + data['message']);
          }
        })
      } else {
        $.ajax({
          type: "POST",
          url: url,
          data: request_pay_param,
          success: function(data, textStatus, jqXHR) {
            if (data['status'] == 200) {
              // $('#orderAmount').html(data.data.amount_cny);
              Pay.showMessage("短信发送成功，请接受验证码并提交!");
              $('#payDebitBtn,#payCreditBtn,#payCreditBtn_tt').css('backgroundColor', '#6D80A4');
            } else {
              Pay.showMessage("短信发送失败:" + data['message']);
            }
          }

        });
      }
    },

    // 借记卡获取验证码
    _getValidateCodeDebitCardClicked: function(e) { 
      console.log("getValidateCodeDebitCardClicked");
      var curEl = $(e.currentTarget);
      if (curEl.hasClass('disable')) {
        return;
      }
      if ( !(curEl.attr('id') == 'getInfoCodeDebitCard') ) {
          if (!validate($('#debitCardForm'), 'code')) {
            console.log(!validate($('#debitCardForm'), 'code'))
            return;
        }
      }

      // if (!validate($('#debitCardForm'), 'code')) {
      //   return;
      // }
      this._countdown(curEl);


      invhero_shengpay_yijian_param['card_type'] = "debit_card";
      invhero_shengpay_yijian_param['card_no'] = $("#debitCardNo").val()||$('.pitchUp').attr('bankCardNo');
      invhero_shengpay_yijian_param['card_user_name'] = $("#debitCardRealName").val()||$('.pitchUp').attr('realName');
      invhero_shengpay_yijian_param['card_certif_id'] = $("#debitCardIDNo").val()||$('.pitchUp').attr('idNo');
      invhero_shengpay_yijian_param['card_phone_no'] = $("#debitCardMobileNo").val()||$('.pitchUp').attr('mobileNo');
      invhero_shengpay_yijian_param['access_token'] = getCookie("token");
      // request_pay_param['sms_code'] = $("#debitCardMobileNo").val()||$('.pitchUp').attr('mobileNo');

      var pathname = window.location.pathname; // Returns path only
      var url = window.location.href; // Returns full URL

      var p = $.extend({}, invhero_shengpay_yijian_param);

      var url = getApiServerUrlPrefix() + '/v1/user/pay/deposit_chinagpay_express/send_sms/?';

      if ( !curEl.hasClass('two') ) {
        curEl.addClass('two');
        $.ajax({
          type: 'post',
          url: getApiServerUrlPrefix() + '/v1/user/pay/deposit_chinagpay_express/request_pay/?',
          data: p
        }).then(function( data ) {
          request_pay_param.express_deposit_id = data.data.express_deposit_id;
          if ( data.status == 200 ) {
            // $('#orderAmount').html(data.data.amount_cny);
            Pay.showMessage("短信发送成功，请接受验证码并提交!", '支付金额为:' + data.data.amount_cny/100 + '元');
            $('#payDebitBtn,#payCreditBtn,#payCreditBtn_tt').css('backgroundColor', '#6D80A4');
          }else {
              Pay.showMessage("短信发送失败:" + data['message']);
          }
        })
      } else {
        $.ajax({
          type: "POST",
          url: url,
          data: request_pay_param,
          success: function(data, textStatus, jqXHR) {
            if (data['status'] == 200) {
              // $('#orderAmount').html(data.data.amount_cny);
              Pay.showMessage("短信发送成功，请接受验证码并提交!");
              $('#payDebitBtn,#payCreditBtn,#payCreditBtn_tt').css('backgroundColor', '#6D80A4');
            } else {
              Pay.showMessage("短信发送失败:" + data['message']);
            }
          }

        });
      }
    },

    _validate: function(curEl, type) {
      var val = curEl.val(),
        val = val && val.trim();


      if (!val) {
        this.showError(curEl, '不能为空');
        return;
      }


      if (type === 'cardId') {
        if (!IdCardValidate(val)) {
          this.showError(curEl, '错误的身份证号码');
          return;
        }
      }

      /**
       * 1|允许出金条件修改为：卡号位数等于16位、18位、19位允许出金。
       * 2、卡号位数为15位、16位时，卡号前四位是6225、4514、4392、4367、5187、5236、5218、5194、5123、3568则判断为信用卡，
       * 输入框下方文案提示“十分抱歉！暂时不支持出金到信用卡”。
       */

      if (type === 'bankId') {
        if (!/^\d{19}$/.test(val) && !/^\d{18}$/.test(val)) {
          var msg = '错误的卡号';

          /*
          if ((/^\d{16}$/.test(val) || /^\d{15}$/.test(val)) && /^(6225)|(4514)|(4392)|(4367)|(5187)|(5236)|(5218)|(5194)|(5123)|(3568)/.test(val)) {
            msg = '十分抱歉！暂时不支持出金到信用卡'
          } else 
          */
          if (/^\d{16}$/.test(val) || /^\d{15}$/.test(val) ) {
            this.hideError(curEl);
            return true;
          }

          this.showError(curEl, msg);
          return;
        }
      }

      if (type && type.match(/\/.*\//)) {
        type = type.slice(1, type.length - 1);
        var reg = new RegExp(type);
        if (!reg.test(val)) {
          this.showError(curEl, curEl.attr('data-message') + '错误')
          return;
        }
      }


      // if (type === 'compareTotal') {
      //   if (!val) {
      //     this.showError(curEl, '不能为空');
      //     return;
      //   } else if (!/^\d+(\.\d+)?$/.test(val)) {
      //     this.showError(curEl, '金额只能为数字');
      //     return;
      //   } else if (parseFloat($('.J_AvaiableNum').val() || 0) < parseFloat(val)) {
      //     this.showError(curEl, '出金金额应小于可提金额');
      //     return;
      //   } else if (parseFloat(val) < 100) {
      //     this.showError(curEl, '出金金额应大于100美元');
      //     return;
      //   }
      // }

      // if (type === 'img' && this.newBank) {
      //   if ($('img', curEl).length === 0) {
      //     this.showError(curEl, '您还没上传照片');
      //     return;
      //   }
      // }

      this.hideError(curEl);

      return true;
    },

    showError: function(wrapperEl, message) {
      wrapperEl = wrapperEl.parent();
      var errorEl = $('.err', wrapperEl);
      wrapperEl.addClass('error').removeClass('success');
      if (errorEl.length > 0) {
        var msgEl = $('p', wrapperEl).text(message);
        return;
      }
      var html = [
        '<div class="err">',
        '   <p>' + message + '</p>',
        '</div>'
      ].join('');

      wrapperEl.append(html);
    },

    hideError: function(wrapperEl) {
      wrapperEl = wrapperEl.parent();
      wrapperEl.removeClass('error').addClass('success');
    },

    showMessage: function(message,depotVal) {
      var dialogEl = $('#J_Dialog');
      $('.bd', dialogEl).text(message);
      $('.bd_deposit').text(depotVal);
      dialogEl.show();

      dialogEl.on('click', '.ft', this.hideMessage);
    },

    hideMessage: function() {
      var isSuccess = $('body').attr('class').indexOf('pay-success') !== -1;
      if ( isSuccess ) {
        var urlParams = getQueryParams(window.location.search);
        // android app跳转到本地文件
        if (urlParams['from'] == 'androidapp') {
          window.location = 'invhero-android:GoToUrl?Url=file:///android_asset/s/option.html';
        }
        else {
          // window.location = invhero_shengpay_yijian_param['back_url'];
          var wl = '';
          if (location.pathname.indexOf('/s/') != 0) {
            wl = location.pathname.substring(1, location.pathname.indexOf('/s/'));
          }
          url = location.origin + '/' + wl + '/s/recharge.html';
          window.location = url;
        }
      }
      $('#J_Dialog').hide().off('click', '.ft', this.hideMessage);
    }

  }

  Pay.init();
})();

function changedBank(obj, obj2) {
  var headTitle = document.getElementById('changeOtherBank');
  var logo = document.getElementById('logo');
  var headTitleLast = document.getElementById('title');
  var bank = document.getElementById('bank');
  var creditBank = document.getElementById('creditBank');
  var debitCardForm = document.getElementById('debitCardForm');
  var creditCardForm = document.getElementById('creditCardForm');
  var bankNameId = document.getElementById('bankName');
  if (headTitle.style.display == "none") {
    headTitle.style.display = "block";
    headTitleLast.style.display = "none";
    logo.style.display = "none";
    bank.style.display = "none";
    creditBank.style.display = "none";
  }

  if (obj == "bank") {
    debitCardForm.style.display = "block";
    var bankName = obj2 + "(储蓄卡)";
    bankNameId.innerHTML = bankName;
  } else if (obj == "creditBank") {
    creditCardForm.style.display = "block";
  }
}

function bankClicked(type, code, name) {
  console.log("bankClicked: " + type + " " + code + " " + name);
  var bankCardType = $('.pitchUp').attr('bankCardType'),
  bankCode = $('.pitchUp').attr('bankCode');
  if ( code ) {
      invhero_shengpay_yijian_param['bankCode'] = code;
      $(".title_sp").text('添加银行卡');
      bankCardType = '';
  }else{
      invhero_shengpay_yijian_param['bankCode'] = bankCode;
       $(".title_sp").text('编辑银行卡');

  }


  if (type == "DR"||bankCardType=='DR') {
    if (!code) {
       $('#payDebitBtn').val('保存并付款');
      $('#debitCardNo').val($('.pitchUp').attr('bankCardNo'));
      $('#debitCardRealName').val($('.pitchUp').attr('realName'));
      $('#debitCardIDNo').val($('.pitchUp').attr('idNo'));
      $('#debitCardMobileNo').val($('.pitchUp').attr('mobileNo'));
    }else{
       $('#payDebitBtn').val('确认付款');
        $('#debitCardNo').val('');
      $('#debitCardRealName').val('');
      $('#debitCardIDNo').val('');
      $('#debitCardMobileNo').val('');
    }
   
    $("#bank").hide();
    // $("#logo").hide();
    // $("#title").hide();
    // $("#title").text()
    $("#creditBank").hide();
    $("#debitBank").hide();
    $("#chooseBankHint").hide();
    $('#recordPage').hide();

    // $("#changeOtherBank").show();

    $("#debitCardForm").show();

    // if ( name ) {
    //   $("#debitBankName").html(name + "(借记卡)");
    // }else{
    //   $("#debitBankName").html(bankIfoObj[bankCode] + "(借记卡)");
    // }

    $("#debitBankName").html('银行卡信息');
    
  } else if (type == "CR"||bankCardType=='CR') {
      if ( !code ) {
        $('#payDebitBtn').val('保存并付款');
          $('#creditNum').val($('.pitchUp').attr('bankCardNo'));
        $('#creditName').val($('.pitchUp').attr('realName'));
        $('#creditPsnNum').val($('.pitchUp').attr('idNo'));
        $('#creditPhNum').val($('.pitchUp').attr('mobileNo'));
        $('#CVV2Num').val($('.pitchUp').attr('cvv2'));
        $('#validThru').val($('.pitchUp').attr('validThru'))
      }else{
         $('#payDebitBtn').val('确认付款');
          $('#creditNum').val('');
        $('#creditName').val('');
        $('#creditPsnNum').val('');
        $('#creditPhNum').val('');
        $('#CVV2Num').val('');
        $('#validThru').val('')
      }
    $("#bank").hide();
    // $("#logo").hide();
    // $("#title").hide();
    $("#creditBank").hide();
    $("#debitBank").hide();
    $("#chooseBankHint").hide();
    $('#recordPage').hide();

    // $("#changeOtherBank").show();


    $("#creditCardForm").show();

    if ( name ) {
      $("#creditBankName").html(name + "(信用卡)");
    }else{
      $("#debitBankName").html(bankIfoObj[bankCode] + "(借记卡)");
    } 

  }
}

function selectBankClicked() {
  console.log("selectBankClicked");

  $("#changeOtherBank").hide();
  $("#creditCardForm").hide();
  $("#debitCardForm").hide();

  $("#bank").show();
  $("#logo").show();
  $("#title").show();
  if ( getHasCreditBank() ) {
    $("#creditBank").show();
  }
  $("#debitBank").show();
  $("#chooseBankHint").show();
}
var invhero_shengpay_yijian_param = {
  amount: 0,
  card_no: '',
  card_user_name: '',
  card_phone_no: '',
  card_certif_type: '01',
  card_certif_id: '',
  card_type: '',
  card_expiration: '',
  card_cvv2: '',
  access_token: getCookie("token"),

};

var request_pay_param = {
  sms_code:'',
  express_deposit_id: '',
  access_token: getCookie("token"),
}

function getApiServerUrlPrefix() {
  var dev = getProduClothedUrl();
  var prod = getProduClothedUrl();
  if (window.location.origin == 'file://')
      return dev;
  if (window.location.hostname == 'waibao.invhero.com')
      return dev;
  if (window.location.hostname == '210.72.229.191')
      return dev;
  if (window.location.hostname == 'localhost')
      return dev;
  if (window.location.hostname == '127.0.0.1')
      return dev;
      
  return prod;
}

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1);
    if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
  }

}

function getQueryParams(qs) {
  qs = qs.split('+').join(' ');
  var params = {},
    tokens,
    re = /[?&]?([^=]+)=([^&]*)/g;
  while (tokens = re.exec(qs)) {
    params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
  }
  return params;
}

function initPage() {
  var urlParams = getQueryParams(window.location.search);
  invhero_shengpay_yijian_param['amount'] = urlParams['amount'];
  // invhero_shengpay_yijian_param['pay_amount'] = urlParams['pay_amount'];
  invhero_shengpay_yijian_param['back_url'] = urlParams['back_url'];

  $('#orderAmount').html(invhero_shengpay_yijian_param['amount']);


  var url = urlParams['src'];
  var f = urlParams['from'];
  if (url) {
    // androidApp需要单独设置返回地址
    if (f == 'androidApp') {
      url = 'invhero-android:GoToUrl?Url=' + url;
      $('#go-back').hide();
    }
    $('#go-back').attr('href', url);
  }
}

// 信用卡有效期处理
function keyUpFunc(e) {
  return;
  var v = $('#validThru').val() || $('#validThru_b').val(),
      curEl = $('#validThru').val() ? $('#validThru') : $('#validThru_b');
  if (v.length == 2) {
    var charCode = (e.which) ? e.which : e.keyCode;
    if (charCode == 8) {
      // $('#validThru').val(v.substring(0,1));
      changeKeyVal(curEl,charCode,v)
    }
    else {
      // $('#validThru').val(v + '/');
      changeKeyVal(curEl,charCode,v)
    }
  }
}

function changeKeyVal(curEl,charCode,v) {
  if ( charCode == 8 ) {
    curEl.val(v.substring(0,1))
  } else {
    curEl.val(v + '/');
  }
}

// 只需验证是否为 success
function validate(formEl, type) {
  var success = true;

  $('input', formEl).each(function(index, inputEl) {
    inputEl = $(inputEl);
    if (!inputEl.parent().hasClass('code') && !inputEl.parent().hasClass('submit')) {
      Pay._validate(inputEl, inputEl.attr('data-validate'))
    }
  });
  $('.input-wrapper', formEl).each(function(index, item) {
    item = $(item);
    if (type === 'code') {
      if (!item.hasClass('success') && !item.hasClass('code') && !item.hasClass('submit') && !item.hasClass('check')) {
        success = false;
      }
    } else {
      if (!item.hasClass('success') && !item.hasClass('submit')) {
        success = false;
      }
    }
  });

  var radioEl = $('.J_Radio', formEl);
  if (!radioEl.hasClass('active')) {
    Pay.showError(radioEl.parent(), '需要同意支付协议');
    success = false;
  }

  return success;
}

//确认付款（有记录的情况）
function recordPayBtnClicked() {
  var recordPageEl = $('#recordPage');
  var bankCardType = $('.pitchUp').attr('bankCardType');
  $('#payCreditBtn_tt').addClass("sure")
  if ( bankCardType == 'DR' ) {
      payDebitBtnClicked(this);
  }else if ( bankCardType == 'CR' ) {
      $('.J_Validate', recordPageEl).trigger('blur');
      //先做一个简单的非空验证
      if ( !$('#validThru_b').val() || !$('#CVV2Num_b').val() || !$('#debitCardValidateCode_t').val() ) {
        return;
      }
      payCreditBtnClicked(this);
  }
}

// 借记卡支付
function payDebitBtnClicked(that) {
  console.log("payDebitBtnClicked");

  var codeEl = $("#debitCardValidateCode");
  var smsEl = $('#debitCardValidateCode_t');
  console.log(that)
  if ( $('#payCreditBtn_tt').attr('class')=='sure' ) {
  }else{
    if (!codeEl.parent().hasClass('success')) {
      return;
    }
  }

  var p = request_pay_param;
  p['sms_code'] = codeEl.val() || smsEl.val();

  var url = getApiServerUrlPrefix() + '/v1/user/pay/deposit_chinagpay_express/confirm/?'
  $('#J_Load').show();
  var isPaySuccess = true;
  if ( isPaySuccess ) {
    isPaySuccess = false;
    $.ajax({
      type: "POST",
      url: url,
      data: p,
      success: function(data, textStatus, jqXHR) {
        console.log(data);
        isPaySuccess = true;
        $('#J_Load').hide();
        if (data['status'] == 200) {
          Pay.showMessage("支付成功。");
          $('body').attr('class', 'pay-success');
          setTimeout(function(){ 
            var urlParams = getQueryParams(window.location.search);
              // android app跳转到本地文件
              if (urlParams['from'] == 'androidapp') {
                window.location = 'invhero-android:GoToUrl?Url=file:///android_asset/s/option.html';
              }
              else {
                // window.location = invhero_shengpay_yijian_param['back_url'];
                var wl = '';
                if (location.pathname.indexOf('/s/') != 0) {
                  wl = location.pathname.substring(1, location.pathname.indexOf('/s/'));
                }
                url = location.origin + '/' + wl + '/s/recharge.html';
                window.location = url;
              }
            }, 7000);

         
        } else {
          isPaySuccess = true;
          Pay.showMessage(data['message']);
        }
      },
      dataType: "json"
    });
  } 

}

// 信用卡支付
function payCreditBtnClicked() {
  console.log("payCreditBtnClicked");
  var codeEl = $("#creditCardValidateCode");
  var smsEl = $('#debitCardValidateCode_t');
  if ( $('#payCreditBtn_tt').attr('class')=='sure' ) {
  }else{
    if (!codeEl.parent().hasClass('success')) {
      return;
    }
  }
  var sms_val = codeEl.val() || smsEl.val();
  var p = request_pay_param;
  p['sms_code'] = sms_val;
  var url = getApiServerUrlPrefix() + '/v1/user/pay/deposit_chinagpay_express/confirm/?'
  $('#J_Load').show();
  var isPaySuccess = true;
  if ( isPaySuccess ) {
    isPaySuccess = false;
    $.ajax({
      type: "POST",
      url: url,
      data: p,
      success: function(data, textStatus, jqXHR) {
        $('#J_Load').hide();
        isPaySuccess = true;
        if (data['status'] == 200) {
          Pay.showMessage("支付成功。");

          setTimeout(function(){ 
            var urlParams = getQueryParams(window.location.search);
              // android app跳转到本地文件
              if (urlParams['from'] == 'androidapp') {
                window.location = 'invhero-android:GoToUrl?Url=file:///android_asset/s/option.html';
              }
              else {
                // window.location = invhero_shengpay_yijian_param['back_url'];
                var wl = '';
                if (location.pathname.indexOf('/s/') != 0) {
                  wl = location.pathname.substring(1, location.pathname.indexOf('/s/'));
                }
                url = location.origin + '/' + wl + '/s/recharge.html';
                window.location = url;
              }
            }, 7000);

         
        } else {
          Pay.showMessage(data['message']);
        }
      },
      dataType: "json"
    });
  }
 
}


var Wi = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2, 1]; // 加权因子
var ValideCode = [1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2]; // 身份证验证位值.10代表X
function IdCardValidate(idCard) {
  idCard = trim(idCard.replace(/ /g, ""));
  if (idCard.length == 15) {
    return isValidityBrithBy15IdCard(idCard);
  } else if (idCard.length == 18) {
    var a_idCard = idCard.split(""); // 得到身份证数组
    if (isValidityBrithBy18IdCard(idCard) && isTrueValidateCodeBy18IdCard(a_idCard)) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
/**
 * 判断身份证号码为18位时最后的验证位是否正确
 * @param a_idCard 身份证号码数组
 * @return
 */
function isTrueValidateCodeBy18IdCard(a_idCard) {
  var sum = 0; // 声明加权求和变量
  if (a_idCard[17].toLowerCase() == 'x') {
    a_idCard[17] = 10; // 将最后位为x的验证码替换为10方便后续操作
  }
  for (var i = 0; i < 17; i++) {
    sum += Wi[i] * a_idCard[i]; // 加权求和
  }
  var valCodePosition = sum % 11; // 得到验证码所位置
  if (a_idCard[17] == ValideCode[valCodePosition]) {
    return true;
  } else {
    return false;
  }
}
/**
 * 通过身份证判断是男是女
 * @param idCard 15/18位身份证号码 
 * @return 'female'-女、'male'-男
 */
function maleOrFemalByIdCard(idCard) {
  idCard = trim(idCard.replace(/ /g, "")); // 对身份证号码做处理。包括字符间有空格。
  if (idCard.length == 15) {
    if (idCard.substring(14, 15) % 2 == 0) {
      return 'female';
    } else {
      return 'male';
    }
  } else if (idCard.length == 18) {
    if (idCard.substring(14, 17) % 2 == 0) {
      return 'female';
    } else {
      return 'male';
    }
  } else {
    return null;
  }
}
/**
 * 验证18位数身份证号码中的生日是否是有效生日
 * @param idCard 18位书身份证字符串
 * @return
 */
function isValidityBrithBy18IdCard(idCard18) {
  var year = idCard18.substring(6, 10);
  var month = idCard18.substring(10, 12);
  var day = idCard18.substring(12, 14);
  var temp_date = new Date(year, parseFloat(month) - 1, parseFloat(day));
  // 这里用getFullYear()获取年份，避免千年虫问题
  if (temp_date.getFullYear() != parseFloat(year) || temp_date.getMonth() != parseFloat(month) - 1 || temp_date.getDate() != parseFloat(day)) {
    return false;
  } else {
    return true;
  }
}
/**
 * 验证15位数身份证号码中的生日是否是有效生日
 * @param idCard15 15位书身份证字符串
 * @return
 */
function isValidityBrithBy15IdCard(idCard15) {
  var year = idCard15.substring(6, 8);
  var month = idCard15.substring(8, 10);
  var day = idCard15.substring(10, 12);
  var temp_date = new Date(year, parseFloat(month) - 1, parseFloat(day));
  // 对于老身份证中的你年龄则不需考虑千年虫问题而使用getYear()方法
  if (temp_date.getYear() != parseFloat(year) || temp_date.getMonth() != parseFloat(month) - 1 || temp_date.getDate() != parseFloat(day)) {
    return false;
  } else {
    return true;
  }
}
//去掉字符串头尾空格
function trim(str) {
  return str.trim();
}

//银行卡对象
var bankIfoObj = {
  CMB : '招商银行',
  BOC : '中国银行',
  ABC : '农业银行',
  PSBC : '中国邮储银行',
  CEB : '光大银行',
  SZPAB : '平安银行',
  CCB : '建设银行',
  CMBC : '民生银行',
  GDB : '广发银行',
  SPDB : '浦东发展银行',
  BOS : '上海银行',
  HXB : '华夏银行',
  COMM : '交通银行',
  ICBC : '工商银行',
  HEB : '河北银行',
  BCCB : '北京银行',
  CIB : '兴业银行',
  CITI : '花旗银行',
  CITIC : '中信银行',
  SHRCB : '上海农商银行',
  JSB : '江苏银行',
  NJCB : '南京银行',
  HKBEA : '东亚银行',
  NCC : '南昌银行',
  NBCB : '宁波银行',
  BSB : '包商银行',
  LZ : '兰州银行',
  WFCCB : '潍坊银行',
  HCCB : '杭州银行',
  WZCB : '温州银行',
  SR : '上饶银行'
}