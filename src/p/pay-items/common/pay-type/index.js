"use strict";

var Base = require('../../../../app/base');
var Uri = require('../../../../app/uri');
var Cookie = require('../../../../lib/cookie');
var tmpl = require('./index.ejs');
export default class PayType extends Base {
    constructor(config) {
        super(config);

        this._init();
    }

    _init() {
        this._render();
    }

    _lazyBind() {
        this.el.on('click', '.J_Fold', $.proxy(this._fold, this));

        this.el.on('click', '.pay-item', (e) => {
            var curEl = $(e.currentTarget),
                codeToUrl = curEl.attr('data-code');

            if (curEl.hasClass('active')) {
                $('.J_Fold').trigger('click');
                return false;
            }

            curEl.siblings().removeClass('active');
            $('.J_Radio').removeClass('active');

            curEl.addClass('active');
            $('.J_Radio', curEl).addClass('active');

            $('.J_Fold').trigger('click');

            this._linkToPay(codeToUrl);
        });
    }

    _fold(e) {
        var curEl = $(e.currentTarget);

        if (curEl.hasClass('unfold')) {
            curEl.parent().removeClass('unfold');
            curEl.removeClass('unfold');
        } else {
            curEl.parent().addClass('unfold');
            curEl.addClass('unfold');
        }
    }

    _linkToPay(htmlCode) {
        if (htmlCode) {
            var serializeUrl = this._serializeUrl(htmlCode);
            location.href = './' + htmlCode + '.html?' + serializeUrl;
        }
    }

    _serializeUrl(defaultPay) {
        var urlParams = new Uri().getParams();

        if (defaultPay) {
            urlParams.defaultPay = defaultPay;
        }
        
        return $.param(urlParams);
    }

    _getPays() {
        var self = this;
        return this.ajax({
            url: '/v1/user/pay/channel/list/',
            data: {
                access_token: Cookie.get('token'),
                env: 'h5'
            }
        }).then(function (data) {
            return data.data;
        })
    }

    _render() {
        var self = this;
        var defaultPay = new Uri().getParam('defaultPay');

        this._getPays().then(function(pays) {
            pays = [
                {enable_pc: 1, code: "depost_pc", enable_h5: 0, name: null}
            ];

            self.renderTo(tmpl, {
                pays: pays,
                defaultPay: defaultPay,
            }, self.el);

            self._lazyBind();
        })    
    }
}