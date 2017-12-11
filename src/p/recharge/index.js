
"use strict";

var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var Uri = require('../../app/uri');
var Util = require('../../app/util.js');
var Charge = require('../../common/charge');
var Dialog = require('../../common/dialog');
var Sticky = require('../../common/sticky');
var tmpl = require('./index.ejs');
var dialogTmpl = require('./dialog.ejs');
var dialogErrorTmpl = require('./dialog-error.ejs');
var CustomerService = require('../../common/customer-service');
var Config = require('../../app/config');
var qrcode = require('../../lib/qrcode');

function Recharge() {
    Recharge.superclass.constructor.apply(this, arguments);
    var self = this;
    var self = this;
    this.login().then(function() {
        self.init();
    }, function() {
        var src = new Uri().getParam('src');
        src = src ? src : './my.html';
        location.href = src;
    });
}

Base.extend(Recharge, PageBase, {
    init: function() {
        this._initAttrs();
        // this._getRate();
        this._bind();
        this._requires();
        this._getData();
        this._getServicePhone();
        this.configStatistics();
        this.onlyOne = true;
        // this.channel = 'weixin';
        this. _payController();
    },

    _bind: function() {
        var doc = $(document);
        // doc.on('click', '.J_Radio', $.proxy(this._select, this));
        doc.on('tap', '.J_Submit', $.proxy(this._submit, this));
        
        doc.on('click', '.J_PCwSubmit', $.proxy(this._pcWsubmit, this));
        //doc.on('click', '.J_Fold', $.proxy(this._fold, this));
        $('.J_Fold').on('click', $.proxy(this._fold, this))

        $('#J_Charge,.J_Charge,.J_Charge4,.Kj_pay_1').on('blur', $.proxy(this._inputBlur, this));

        $('#J_MobilePayText').html(getMobilePayTextWL());

        var pul = getPayUrlWL();
        if (pul != '') {
            $('#payurl').html(pul);
        }
        else {
            $('#J_OnlinePay').remove();
        }

        if ( !Util.isWeixin() || getWXWL() == 'ifbao' ) {
            $('.press').hide();
        }

        if ( Util.isWeixin() && getWXWL() != 'ifbao' ) {
            $('.pay_stepAsk').hide();
        }

        $('#J_Charge').attr('placeholder', '请输入金额, 如: 500');

        if ( getWXWL() == 'hwbj' ) {
            var H_El = $('.kuaijie');
            H_El.addClass('qq-pay');
            $('p', H_El).text('QQ钱包支付')
        }


        $('.pay-item').on('click', (e) => {
            var curEl = $(e.currentTarget);
            if ($(e.target).hasClass('J_Radio')) {
                return;
            }

            var radioEl = $('.J_Radio', curEl);

            if (radioEl.hasClass('active')) {

            } else {
                // radioEl.trigger('click');
                this._select({
                    currentTarget: $('.J_Radio', curEl)
                })
            }
            $('.J_Fold').trigger('click');
        });

        // 添加默认微信分享
        if (this.isWeixin()) {
          this.setupWeiXinShare('default_invite');
        }

    },

    _payController: function() {
        this._showPayWay();
        this._defaultPayment();
    },

    _defaultPayment: function () {
        var kjEl = $('.kuaijie'),
            kjEl_1 = $('.kuaijie_1'),
            wxEl = $('.pay-itemWQ'),
            zfEl = $('.pay-itemZfu'),
            footerEl = $('footer'),
            contentEl = $('.tab-content');

        // 银联快捷
        if (getDefaultPayment() == 'kjpay') {
            contentEl.hide()
            $(contentEl[2]).show();
            kjEl.addClass('active');
            $('.J_Radio', kjEl).addClass('active');
            $('.weixinQR').removeClass('weixinQR');
        }
        // 银联快捷 -1
        if (getDefaultPayment() == 'kjpay_1') {
            contentEl.hide()
            $(contentEl[3]).show();
            kjEl_1.addClass('active');
            $('.J_Radio', kjEl_1).addClass('active');
            $('.weixinQR').removeClass('weixinQR');
        }
        // 支付宝
        else if ( Util.isZhifubao() || getDefaultPayment() == 'zfpay') {
            this.channel = 'zhifubao';
            contentEl.hide();
            $(contentEl[1]).show();
            zfEl.addClass('active');
            $('.pay_stepAsk').show();
            $('.J_Radio', zfEl).addClass('active');
        } 

        //网银
        else if (getDefaultPayment() == 'pcWy') {
            footerEl.hide();
            contentEl.hide();
            $(contentEl[3]).show();
            $('.pcWangyin').addClass('active');
            $('.pcWangyin .J_Radio').addClass('active');
        }
        // 网页
        else if( getDefaultPayment() == 'pcpay' ) {
            footerEl.hide();
            contentEl.hide();
            $(contentEl[4]).show();
            $('.pcPay').addClass('active');
            $('.pcPay .J_Radio').addClass('active');
        }
        // 微信
        else { 
            this.channel = 'weixin';
            wxEl.addClass('active');
            $('.app_name').html('微信');
            $('.J_Radio', wxEl).addClass('active');
        }
    },

    _showPayWay: function() {
        var WqEl = $('.pay-itemWQ'),
            ZfEl = $('.pay-itemZfu'),
            pcEl = $('.pcPay'),
            KjEl = $('.kuaijie'),
            KjEl_1 = $('.kuaijie_1'),
            pcWEl = $('.pcWangyin');
        /**
        **  @1  支付宝，快捷，网页
        **  @2  微信， 快捷， 网页
        **  @3  微信，支付宝，网页  
        **  @4  快捷， 网页
        **  @5  网页
        **  @6  微信, 网页
        **  @7  支付宝, 网页
        *   @8  网银, 网页
        *   @9  网银
        *   @10 网银, 网页 快捷
        *   @11 快捷, 快捷-1, 网银, 网页 
        **/

        switch( getShowPayWay() ) {
            case 1:
                WqEl.hide();
                pcWEl.hide();
                KjEl_1.hide();
                break;
            case 2: 
                ZfEl.hide();
                pcWEl.hide();
                KjEl_1.hide();
                break;
            case 3: 
                KjEl.hide();
                pcWEl.hide();
                KjEl_1.hide();
                break;
            case 4: 
                WqEl.hide();
                ZfEl.hide();
                pcWEl.hide();
                KjEl_1.hide();
                break;
            case 5: 
                KjEl.hide();
                ZfEl.hide();
                WqEl.hide();
                pcWEl.hide();
                KjEl_1.hide();
                break;
            case 6: 
                ZfEl.hide();
                KjEl.hide();
                pcWEl.hide();
                KjEl_1.hide();
                break;
            case 7: 
                KjEl.hide();
                WqEl.hide();
                pcWEl.hide();
                KjEl_1.hide();
                break;
            case 8:
                KjEl.hide();
                ZfEl.hide();
                WqEl.hide();
                KjEl_1.hide();
                break;
            case 9:
                KjEl.hide();
                ZfEl.hide();
                WqEl.hide();
                pcEl.hide();
                KjEl_1.hide();
                break;
            case 10:
                ZfEl.hide();
                WqEl.hide();
                KjEl_1.hide();
                break;
            case 11:
                ZfEl.hide();
                WqEl.hide();
                break;
            default:
                break;
        }
    },

    _getServicePhone: function(token) {

        if (showServiceWeixin()) {
            $('.phone-wrapper-bottom').html(
                '客服微信:<a>' +getServiceWeixin()+'</a>'
            )

            return
        }
        var self = this;
        return this.ajax({
          url: '/v1/customer_call',
          data: {
            access_token: this.cookie.get('token'),
            _r: Math.random()
          }
        }).then(function(data) {
          var h;

          if ( !data.data.phone ) {
            $('.phone-wrapper-bottom').hide();
          }

          if (Config.isAndroidAPK()) {
            h = 'invhero-android:call?phone=' + data.data.phone;
          }
          else {
            h = 'tel:' + data.data.phone;
          }
          // 设置链接
          $('.J_SPhone').attr('href', h);
          // 设置text
          $('.J_SPhone').text(data.data.phone);
        });
    },

    _fold: function(e) {
        var curEl = $(e.currentTarget);

        if (curEl.hasClass('unfold')) {
            curEl.parent().removeClass('unfold');
            curEl.removeClass('unfold');
        } else {
            curEl.parent().addClass('unfold');
            curEl.addClass('unfold');
        }
    },

    _select: function(e) {
        this.onlyOne = true;
        $('.J_RateNum,.J_Bonus').html('-- --');
        $(".J_Charge1>input").val('');
        $(".J_Charge2>input").val('');
        var curEl = $(e.currentTarget),
            index = curEl.parent().index();
        // e.stopPropagation();

        if (curEl.hasClass('active')) {
            return;
        }

        $('.J_Radio').removeClass('active');
        $('.pay-item').removeClass('active');
        curEl.addClass('active');
        curEl.parent().addClass('active');

        var tabContentEls = $('.tab-content');
        var footerEl = $('footer');

        tabContentEls.hide();
        $(tabContentEls[index]).show();

        if ( index === 0 || index === 1) {
            $('.J_Submit').addClass('weixinQR');
        } else {
            $('.J_Submit').removeClass('weixinQR');
        }
        if ( index === 0 ) {
            this.channel = 'weixin';
            $('.app_name').html('微信');
            if ( getWXWL() == 'ifbao' ) {
                $('.other').hide();
                $('ifbao').show();
            }
        } else if ( index === 1 ) {
            this.channel = 'zhifubao';
            $('.app_name').html('支付宝');
        }

        if (index === 0 || index === 1 || index === 2 || index == 3) {
            footerEl.show();
        } else {
            footerEl.hide();
        }

        if( index == 3 ) { // 快捷支付-1
            $('.J_Submit').addClass('isKj_1');
        } else {
            $('.J_Submit').removeClass('isKj_1');
        }

        if ( !Util.isWeixin() ) {
            $('.press').hide();
        }


        //如果在微信且是IOS就不显示支付引导，如果在微信且是安卓，支付宝支付显示引导流程，微信不显示，
        //其他情况都显示
        //2017 3.31   ifbao都要显示说明
        if ( Util.isIOS()&&Util.isWeixin()&&getWXWL() != 'ifbao' ) {
            // $('.pay_stepAsk').hide();
            $('.pay_stepAsk').show();
        } else if ( Util.isAndroid()&&Util.isWeixin()&&getWXWL() != 'ifbao' ) {
            if ( index === 0 ) {
                $('.pay_stepAsk').hide();
            } else if ( index === 1 ) {
                $('.pay_stepAsk').show();
                $('.press').hide();
            }
        } else {
            $('.pay_stepAsk').show();
            if ( getWXWL() == 'ifbao' && index === 0 ) {
                $('.other').hide();
                $('.ifbao').show();
            } else {
                $('.other').show();
                $('.ifbao').hide();
            }
            
        }

    },

    _inputBlur: function(e) {
        var curEl = $(e.currentTarget),
            val = curEl.val(),
            bonusEl = $('#J_Bonus');

        if (!this._validate(curEl)) {
            bonusEl.text('-- --');
            $('.J_RateNum').text('-- --');
            $('.J_Submit').addClass('disable');
            return;
        }

        $('.J_Submit').removeClass('disable');

        var bonus = this._getBonus(val);
        bonusEl.text(bonus);
        $('.J_Bonus').html(bonus)
        this._getRate(val);
    },

    _getBonus: function(val) {
        var bonus = 0;

        for (var i = 0, len = this.depositBonus.length; i < len; i++) {
            var deposit = this.depositBonus[i];

            if (val >= deposit.limit) {
                bonus = val * deposit.ratio;
                break;
            }
        }

        return bonus.toFixed(2);
    },

    _getRate: function(val) {
        this.ajax({
            url: '/v1/deposit_withdraw_usdcny_rate',
            data: {
                wl: getWXWL(),
                _r: Math.random()
            }
        }).then(function(data) {
            var rate = parseFloat(data.data.deposit)
            if (!val) {
                this.rate = rate;
                return;
            }
            $('.J_RateNum').text((rate * parseFloat(val)).toFixed(2));
        }.bind(this));
    },

    _createQrcode: function(text, typeNumber, errorCorrectLevel) {

        var qr = qrcode(typeNumber || 8, errorCorrectLevel || 'M');
        qr.addData(text);
        qr.make();

        var w = parseInt(document.body.clientWidth / 55 / 1.6);

        var imgTag = qr.createImgTag(w, w);

        var first = imgTag.indexOf('"');
        var next = imgTag.indexOf('"', first+1);
        var str = imgTag.substring(first+1, next);

        return str;
    },

    _validate: function(curEl) {
        curEl = curEl || $('#J_Charge');
        var val = curEl.val() || 
            $('.J_Charge>#J_Charge').val() || 
            $('.J_Charge2>#J_Charge').val() || 
            $('.J_Charge3>#J_Charge').val() || 
            $('#J_Charge_1').val();

        if (!val) {
            this._showError(curEl, '充值金额不能为空');
            return;
        }

        if (!/^\d+(\.\d+)?$/.test(val)) {
            this._showError(curEl, '充值金额必须为数字');
            return;
        }

        if (parseFloat(val) < getMinDepositWL()) {
            this._showError(curEl, '充值金额不能低于' + getMinDepositWL() + '美元');
            return;
        }

        val = parseFloat(val);

        if (val < 0) {
            this._showError(curEl, '充值金额不能为负数');
            return;
        }

        this._hideError(curEl);

        return true;
    },

    _showError: function(curEl, message) {
        var parent = curEl.parent('li');
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
        var parent = curEl.parent('li');
        var messageEl = curEl.siblings('.err');

        parent.removeClass('error');
        messageEl.hide();
    },

    _submit: function() {
        var self = this;
        var submitEl = $('.J_Submit');
        var chargeEl = $('#J_Charge,.J_Charge');
        chargeEl.trigger('blur');
        if (!this._validate()) {
            return;
        }
        var rateVal = parseFloat($('.J_RateNum').text());
        if (isNaN(rateVal)) {
            rateVal = this.rate * parseFloat(chargeEl.val());
        }

        if (rateVal > 1400000&&getPayUrlWL()) {
            this._showMax();
            return;
        }

        var amount = $('#J_Charge').val() || $('.J_Charge').val() || $('.J_Charge2>input').val();
        if (this.onlyOne) {
            var data = {
                access_token: this.cookie.get('token'),
                amount: amount,
                channel: this.channel
            }

            $('.J_Submit').addClass('disable');
            if ( submitEl.hasClass('weixinQR') ) {

                if ( getWeiXinPayWay() == 'hui' && this.channel == 'weixin' ) {
                    self._subZhiPayWay(data);
                    return;
                } else if ( getWeiXinPayWay() == 'zhihui' ) {
                    self._subWeiXinQrPayWay(data);
                    return;
                }
            } else {
                if ( getEcurrencyPayment() && getWXWL() == 'hwbj' ) {
                    data.channel = 'qq_wallet';
                    data.amount = $('.J_Charge3>#J_Charge').val();
                    self._subWeiXinQrPayWay(data, 'express');
                    return;
                }

                // yzgj
                if (getEcurrencyPayment() && getWXWL() == 'yzgj') {
                    data.type = 'express';
                    data.amount = $('.J_Charge3>#J_Charge').val();
                    self._subWeiXinQrPayWay(data, 'express');
                    return;
                }

                var amountK = $('.J_Charge3>#J_Charge').val();
                var amount_data = 'amount=' + amountK;

                var url,
                    back_url = location.href;
                // android机型需要将用户token传递给本地代码
                if ( Config.isAndroidAPK() ) {
                    //url = location.origin + '/s/stf-kuaijie-pay/index1.html?'+ amount_data + "&_r=" + Math.random() + "&src=" + encodeURIComponent(back_url) + "&from=androidapp";
                    url = location.origin + '/s/stf-kuaijie-pay/cyber.html?'+ amount_data + "&_r=" + Math.random() + "&src=" + encodeURIComponent(back_url) + "&from=androidapp";
                    window.cookie && window.cookie.updateToken(self.cookie.get('token'));
                } 
                //0701 尝试解决白标客户跳转支付链接没有token的问题
                else {
                    var wl = '';
                    if (location.pathname.indexOf('/s/') != 0) {
                        wl = location.pathname.substring(1, location.pathname.indexOf('/s/'));
                    }
                    //url = location.origin + '/' + wl + '/s/stf-kuaijie-pay/index1.html?'+ amount_data + "&_r=" + Math.random() + "&src=" + encodeURIComponent(back_url);
                    url = location.origin + '/' + wl + '/s/stf-kuaijie-pay/cyber.html?'+ amount_data + "&_r=" + Math.random() + "&src=" + encodeURIComponent(back_url);
                }

                if ( getIsjiuPaKuaiJie() && !$('.J_Submit').hasClass('isKj_1')) {
                    // jiupai支付
                    url = location.origin + '/' + wl + '/s/stf-kuaijie-pay/jiupapay.html?'+ amount_data + "&_r=" + Math.random() + "&src=" + encodeURIComponent(back_url);
                }

                window.location.href = url; 
            }
        }
    },

    _pcWsubmit: function() {
        var bankCode = $('.J_PcWpayName').val();
        var amount = $('#J_Charge4').val();
        if (!bankCode || !amount) {
            return;
        }

        if ( amount < getMinDepositWL() ) {
            return;
        }
        var data = {
            access_token: this.cookie.get('token'),
            amount: amount,
            type: 'direct'
        }

        if ( getEcurrencyPayment() ) {
            this._subWeiXinQrPayWay(data, 'express', bankCode);
        }
    },

    _subZhiPayWay: function(data) {
        var self = this;
        // data.access_token = 'token5609';
        data.appType = data.channel;
        var param = {
            access_token: '8bc6fa76-274f-4bd3-b08a-7745731ddc90',
            appType: data.channel,
            amount: data.amount
        }
        this.ajax({
            url: 'https://api.51aishanghui.com/v1/user/pay/deposit_3xmtapay/',
            type: 'POST',
            data: param,
            unjoin: true,
        })
        .then(function( data ) {
            self.onlyOne = true;
            var url = data.data.post_url + '?' + data.data.post_data;
            self.postURL(url);
        },function( err ) {
            // self.onlyOne = true;
            // var dialog = self.dialog;
            // dialog.setContent(data.message);
            // dialog.show();
            // return;
        })
            
    },

    _subWeiXinQrPayWay: function(data, way, bankCode) {
        var self = this;
        self.onlyOne = false;
        self.ajax({
            url: self._getPayUrl(way, data.channel),
            data: data,
            type: 'POST'
        }).then(function(data) {
            if (bankCode) {
                var url = data.data.post_url + "?" + data.data.post_data + '&v_pmode=' + bankCode;
                self.postURL(url)
                return
            }

            if ( way == 'express' ) {
                var url = data.data.post_url + "?" + data.data.post_data;
                self.postURL(url)
                return
            }
            
            self.onlyOne = true;
            $('.J_Submit').removeClass('disable');
            $('.J_Submit').text("确定入金").addClass('disable');
            $('#deposit_header').hide();
            $('.weixinQR-mask').css("display","block");
            $("#qrAmount").text($('.J_RateNum').html());
            var img = self._createQrcode(data.data.qr_code, 5, 'Q');
            $('.imgQR')[0].src = img;
            $('.imgQR_mask')[0].src = img;
        },function (data) {
            self.onlyOne = true;
            $('.J_Submit').removeClass('disable');
            var dialog = self.dialog;
            dialog.setContent(data.message);
            dialog.show();
            return;
        })
    },

    _showMax: function() {
        var dialog = new Dialog({
            isShow: true,
            tmpl: this.render(dialogTmpl)
        });
    },

    _getData: function() {
        var self = this;

        this.ajax({
            // url: '/v1/config',
            url: '/v1/deposit_bonus/config',
            data: {
                access_token: this.cookie.get('token')
            }
        }).then(function(data) {
            var config = data.data.config;
            var params = config.deposit_bonus.real;
            if(params.ratio[0].ratio!==0 || params.ratio[1].ratio!==0 || params.ratio[2].ratio!==0 ){
                self.render(tmpl, params, $('#J_Info'));
                self.render(tmpl, params, $('.J_Info'));
                self.render(tmpl, params, $('.J_Info2'));
                self.render(tmpl, params, $('.J_Info3'));
                self.render(tmpl, params, $('.J_Info3_1'));
                self.render(tmpl, params, $('.J_Info4'));
            }
            self.depositBonus = params.ratio.sort(function(val1, val2) {
                if (val1.limit > val2.limit) {
                    return -1;
                } else if (val1.limit === val2.limit) {
                    return 0;
                } else {
                    return 1;
                }
            });
        });
    },

    _getPayUrl: function(way, channel) {
        var url = '/v1/user/pay/deposit_chinagpay_saoma/';
        if (way == 'express' && getWXWL() == 'yzgj') {
            url = '/v1/user/pay/deposit_payease/';
        }
        else if(way == 'express' && getWXWL() == 'ifbao') {
            url = 'v1/user/pay/deposit_payease/';
        }
        else if ( way == 'express' ) {
            url = '/v1/user/pay/deposit_superstarpay_order/';
        }
        else if (getWXWL() == 'hwbj') {
            url = '/v1/user/pay/deposit_superstarpay_saoma/';
        }
        else if (getWXWL() == 'ytqs' && channel == 'zhifubao') {
            url = '/v1/user/pay/deposit_alipay_saoma/request_pay/';
        }

        return url;
    },

    _initAttrs: function() {
        var phone = this.cookie.get('phone');
        $('#J_Phone,.J_Phone').text(phone);

        var url = new Uri().getParam('src');

        if (url) {
            $('.go-back').attr('href', url);
            $('.mygo-back').attr('href', './recharge.html');
        }
        // 需要隐藏表头
        if (window.location.href.indexOf('from=iphoneapp') != -1 || window.location.href.indexOf('from=androidApp') != -1) {
            $('#J_Header').parent().css("display","none");
        }
    },

    _requires: function() {
        // new CustomerService();
        // $('header').sticky();
        //修改之后
        $('#deposit_header').sticky();
    },

    _showDialogError: function(msg, next) {
        var self = this;

        this.dialog = new Dialog({
            isShow: true,
            tmpl: this.render(dialogErrorTmpl, {
                msg: msg
            }),
            cancleCallback: function() {
                this.destroy();
                next && next();
            }
        });
    }
});

new Recharge();