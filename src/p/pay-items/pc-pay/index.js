
"use strict";

var Base = require('../../../app/base');
var PageBase = require('../../../app/page-base');
var Uri = require('../../../app/uri');
var Sticky = require('../../../common/sticky');
var CheckOpenAccount = require('../../../common/check-open-account');
var PayType = require('../common/pay-type/index');

function Recharge() {
    Recharge.superclass.constructor.apply(this, arguments);
    var self = this;
    this.login().then(function() {
        self.init();
        self.checkOpenAccount = new CheckOpenAccount();
    }, function() {
        var src = new Uri().getParam('src');
        src = src ? src : '../option.html';
        location.href = src;
    });
}

Base.extend(Recharge, PageBase, {
    init: function() {
        this._initAttrs();
        this._requires();
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

        if (showServicePel()) {
            $('.J_CsDesc').html(
                `
                <a href="../cs.html?src=./pay-items/pc-pay.html" class="cs-item">
                    <span class="cs-icon">
                        <img src="../../../../img/cs.jpg" alt="">
                    </span>
                    <span class="cs-desc">详情咨询在线客服</span> 
                </a>
                `
            )
        }
    },

    _requires: function() {
        if (getPayUrlWL()) {
            $('.J_PcUrl').html(getPayUrlWL());
        }

        $('#J_Header').sticky();

        new PayType({
            el: $('.select-content')
        })
    }
});

new Recharge();