
"use strict";

var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var Uri = require('../../app/uri');
var Util = require('../../app/util.js');
var Dialog = require('../../common/dialog');
var Sticky = require('../../common/sticky');
var tmpl = require('./index.ejs');
var dialogTmpl = require('./dialog.ejs');
var payTypeTmpl = require('./pat-type.ejs');
var dialogErrorTmpl = require('./dialog-error.ejs');
var Toast = require('../../common/toast');
var CustomerService = require('../../common/customer-service');
var CheckOpenAccount = require('../../common/check-open-account');
var Config = require('../../app/config');
var qrcode = require('../../lib/qrcode');
var ShowQrCode = require('./component/show-qroce');

function Recharge() {
    Recharge.superclass.constructor.apply(this, arguments);
    var self = this;
    this.login().then(function() {
        self.init();
        self.checkOpenAccount = new CheckOpenAccount();
    }, function() {
        var src = new Uri().getParam('src');
        src = src ? src : './option.html';
        location.href = src;
    });
}

Base.extend(Recharge, PageBase, {
    init: function() {
        this._initAttrs();
        this._bind();
        this._requires();
        this._getData();
        this._getUserInfo();
        // this._getServicePhone();
        this.configStatistics();
        this.onlyOne = true;
    },

    _bind: function() {
        var doc = $(document);

        doc.on('click', '.J_Fold', $.proxy(this._fold, this));
        doc.on('tap', '.J_Submit', $.proxy(this._submit, this));   
        $('#J_Charge').on('blur', $.proxy(this._inputBlur, this));
        $('#J_UserPhone').on('blur', $.proxy(this._validatePhone, this));
        $('#J_UserName').on('blur', $.proxy(this._validateName, this));

        // 添加默认微信分享
        if (this.isWeixin()) {
          this.setupWeiXinShare('default_invite');
        }
    },

    _lazyBind: function() {
        $('.pay-item').on('click', (e) => {
            var curEl = $(e.currentTarget);
            if ($(e.target).hasClass('J_Radio')) {
                return;
            }

            var radioEl = $('.J_Radio', curEl);

            if (radioEl.hasClass('active')) {

            } else {
                this._select({
                    currentTarget: $('.J_Radio', curEl)
                })
            }
            $('.J_Fold').trigger('click');
        });
    },

    _getUserInfo: function() {
        var self = this;
        return self.ajax({
            url: '/v1/deposit/user/info/true/',
            data: {
                access_token: this.cookie.get('token')
            },
        }).then(function(data) {
            data = data.data;
            var phone = data.phone,
                name = data.true_name;
            if (phone) {
                $('#J_UserPhone').val(phone).prop('disabled', true);
            }
            if (name) {
                $('#J_UserName').val(name).prop('disabled', true);
            }
            if (phone && name) {
                self.noPostInfo = true;
            }
        })
    },

    // _getServicePhone: function(token) {
    //     var self = this;
    //     return this.ajax({
    //       url: '/v1/customer_call',
    //       data: {
    //         access_token: this.cookie.get('token'),
    //         _r: Math.random()
    //       }
    //     }).then(function(data) {
    //       var h;

    //       if ( !data.data.phone ) {
    //         $('.phone-wrapper-bottom').hide();
    //       }

    //       if (Config.isAndroidAPK()) {
    //         h = 'invhero-android:call?phone=' + data.data.phone;
    //       }
    //       else {
    //         h = 'tel:' + data.data.phone;
    //       }
    //       // 设置链接
    //       $('.J_SPhone').attr('href', h);
    //       // 设置text
    //       $('.J_SPhone').text(data.data.phone);
    //     });
    // },

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
        var curEl = $(e.currentTarget),
            parentEl = curEl.parent(),
            index = curEl.parent().index();

        if (curEl.hasClass('active')) {
            return;
        }

        $("#J_Charge").val('');
        $('#J_Bonus').html('-- --');
        
        $('.J_Radio').removeClass('active');
        $('.pay-item').removeClass('active');

        curEl.addClass('active');
        parentEl.addClass('active');

        var tabContentEls = $('.tab-content');
        var footerEl = $('footer');

        tabContentEls.hide();
        if (parentEl.hasClass('pay-pc')) {
            $('#J_PcContent').show();
            footerEl.hide();
        } else {
            $('#J_CommonContent').show();
            footerEl.show();
        }
        
        var pay = parentEl.attr('data-pay');
        $('.J_Submit').attr('data-pay', pay);
    },

    _inputBlur: function(e) {
        var curEl = $(e.currentTarget),
            val = curEl.val(),
            bonusEl = $('#J_Bonus');
        
        if (!this._validate(curEl)) {
            bonusEl.text('-- --');
            $('.J_Submit').addClass('disable');
            return;
        }

        $('.J_Submit').removeClass('disable');

        var bonus = this._getBonus(val);
        bonusEl.text(bonus);
        // this._getRate(val);
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
        var val = curEl.val();

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

    _validatePhone: function(curEl) {
        curEl = $('#J_UserPhone');
        curEl.trigger('blur');
        var val = curEl.val();

        if (!val) {
            this._showError(curEl, '不能为空');
            return;
        }

        if (!/^1[3|4|5|8][0-9]\d{8}$/.test(val)) {
            this._showError(curEl, '手机号错误');
            return;
        }

        this._hideError(curEl);
        return true;
    },

    _validateName: function(curEl) {
        curEl = $('#J_UserName');
        curEl.trigger('blur');
        var val = curEl.val();

        if (!val) {
            this._showError(curEl, '不能为空');
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
        var chargeEl = $('#J_Charge');

        chargeEl.trigger('blur');

        if (!this._validatePhone() || !this._validateName() || !this._validate()) {
            return;
        }

        var rateVal = chargeEl.val();
        if (isNaN(rateVal)) {
            rateVal = parseFloat(rateVal);
        }

        if (rateVal > 2000) {
            this._showMax();
            return;
        }

        var amount = chargeEl.val();

        if (!this.onlyOne) {
            return;
        }

        var data = {
            access_token: this.cookie.get('token'),
            amount: amount
        }

        submitEl.addClass('disable');
        var pay = submitEl.attr('data-pay');
        if (!pay) {
            return
        }

        // var payConfig = getPayUrl()[pay];
        var _SubmitFn = '_submit_' + pay;

        this._postInfo();
        this[_SubmitFn](data);
    },

    _postInfo: function() {
        if ( this.noPostInfo ) {
            console.log('no post info...');
            return;
        }
        this.ajax({
            url: '/v1/deposit/user/info/true/',
            data: {
                access_token: this.cookie.get('token'),
                true_name: $('#J_UserName').val(),
                phone: $('#J_UserPhone').val(),
            },
            type: 'POST',
            noToast: true
        })
    },

    _submit_weixin: function(data) {
        var self = this,
            qrel = $('#J_Qr'),
            config = getPayUrl()['weixin'],
            url = config.url,
            params = $.extend(config.params, data),
            openType = config.openType;

        self.onlyOne = false;
        qrel.show();
        self.ajax({
            url: url,
            data: params,
            type: 'GET'
        }).then(function(data) {
            data = data.data;
            self.onlyOne = true;
            self._submitAction(openType, data, 'weixin');
        },function (data) {
            self.onlyOne = true;
            qrel.hide();
            new Toast(data.message);
            return;
        });
    },

    _submit_weixinWeb: function(data) {
        var self = this,
            config = getPayUrl()['weixinWeb'],
            url = config.url,
            params = $.extend(config.params, data),
            openType = config.openType;

        self.onlyOne = false;
        self.ajax({
            url: url,
            data: params,
            type: 'POST'
        }).then(function(data) {
            data = data.data;
            self.onlyOne = true;
            self._submitAction(openType, data, 'weixin');
        },function (data) {
            self.onlyOne = true;
            new Toast(data.message);
            return;
        });
    },

    _submit_zhifubao: function(data) {
        var self = this,
            qrel = $('#J_Qr'),
            config = getPayUrl()['zhifubao'],
            url = config.url,
            params = $.extend(config.params, data),
            openType = config.openType;

        self.onlyOne = false;
        qrel.show();
        self.ajax({
            url: url,
            data: params,
            type: 'POST'
        }).then(function(data) {
            data = data.data;
            self.onlyOne = true;
            self._submitAction(openType, data, 'zhifubao');
        },function (data) {
            self.onlyOne = true;
            qrel.hide();
            new Toast(data.message);
            return;
        });
    },

    _submit_zhifubaoWeb: function(data) {
        var self = this,
            config = getPayUrl()['zhifubao'],
            url = config.url,
            params = $.extend(config.params, data),
            openType = config.openType;

        self.onlyOne = false;
        self.ajax({
            url: url,
            data: params,
            type: 'POST'
        }).then(function(data) {
            data = data.data;
            self.onlyOne = true;
            self._submitAction(openType, data, 'zhifubao');
        },function (data) {
            self.onlyOne = true;
            new Toast(data.message);
            return;
        });
    },

    _submit_kuaijie: function(data) {
        var amount_param = 'amount=' + data.amount;
        var url = getPayUrl()['kuaijie'].url,
            back_url = location.href;
        // android机型需要将用户token传递给本地代码
        if ( Config.isAndroidAPK() ) {
            url = location.origin + url+ amount_param + "&_r=" + Math.random() + "&src=" + encodeURIComponent(back_url) + "&from=androidapp";
            window.cookie && window.cookie.updateToken(self.cookie.get('token'));
        } 
        //0701 尝试解决白标客户跳转支付链接没有token的问题
        else {
            var wl = '';
            if (location.pathname.indexOf('/s/') != 0) {
                wl = location.pathname.substring(1, location.pathname.indexOf('/s/'));
            }
            url = location.origin + '/' + wl + url + amount_param + "&_r=" + Math.random() + "&src=" + encodeURIComponent(back_url);
        }

        window.location.href = url; 
    },

    _submit_wangyin: function(data) {
        console.log(data)
    },

    _submit_pc: function(data) {},

    _submitAction: function(openType, data, type) {
        switch(openType) {
            case 'openUrl': 
                var url = data.post_url + '?' + data.post_data;
                this.qrComponent && this.qrComponent.hide();
                $('#J_Qr').hide();
                location.href = url;
                break;
            case 'postForm':
                var url = data.post_url + '?' + data.post_data;
                this.qrComponent && this.qrComponent.hide();
                $('#J_Qr').hide();
                this.postURL(url);
                break;
            case 'createQr':
                var url = data.url;
                var imgUrl = this._createQrcode(url, 5, 'Q');
                this._inieQrConponent(imgUrl, type);
                break;
            default: 
                break;
        }
    },

    _showMax: function() {
        var dialog = new Dialog({
            isShow: true,
            tmpl: this.render(dialogTmpl)
        });
    },

    _inieQrConponent: function(url, source) {
        this.qrComponent = new ShowQrCode({
            el: $('#J_QrContent'),
            qrUrl: url,
            source: source,
            parent: this
        })
    },

    _getData: function() {
        var self = this;
        this.ajax({
            url: '/v1/deposit_bonus/config',
            data: {
                access_token: this.cookie.get('token')
            }
        }).then(function(data) {
            var config = data.data.config;
            var params = config.deposit_bonus.real;
            if(params.ratio[0].ratio!==0 || params.ratio[1].ratio!==0 || params.ratio[2].ratio!==0 ){
                $.each($('.J_Extra'), function(idx,item) {
                    item = $(item);
                    self.render(tmpl, params, item);
                });
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

    _initAttrs: function() {
        var url = new Uri().getParam('src');

        if (url) {
            $('.go-back').attr('href', url);
        }

        $('.J_Submit').attr('data-pay', getDefaultPayWay());

        // 需要隐藏表头
        if (window.location.href.indexOf('from=iphoneapp') != -1 || window.location.href.indexOf('from=androidApp') != -1) {
            $('#J_Header').parent().css("display","none");
        }
    },

    _requires: function() {
        if (getPayUrlWL()) {
            $('.J_PcUrl').html(getPayUrlWL());
        }

        $('#J_Header').sticky();

        this.renderTo(payTypeTmpl, getShowPayWay(), $('.select-content'));
        this._lazyBind(); 
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