"use strict";

require('../../../lib/zepto');
var Header = require('../../../common/header');
var PageBase = require('../../../app/page-base');
var Util = require('../../../app/util');
var Uri = require('../../../app/uri');
var Config = require('../../../app/config');
var Dialog = require('../../../common/dialog');
var tmpl = require('./index.ejs');

class Lottery extends PageBase {
    constructor() {
        super();

        this._bind();
        this.configStatistics();

        if (this.cookie.get('phone')) {
            this._try(this.cookie.get('phone'), this.cookie.get('token'));
        } else {
            $('.luck-wrapper').show();
        }

        if (this.isWeixin()) {
            this.setupWeiXinShare('1111');
        }
    }

    _bind() {
        var doc = $(document);

        doc.on('tap', '.J_Luck', $.proxy(this._luck, this));
    }

    _luck(e) {
        var telEl = $('#J_Tel');
        var curEl = $(e.currentTarget);
        var tel = telEl.val().trim();

        if (this._validate(tel)) {
            curEl.text('巧取豪夺中…');
            this._try(tel);
        }
    }

    _try(tel, token) {
        var params = new Uri().getParams();
        var params = {
            phone: tel,
            cc: 86,
            p: params.p || 'cfdaff70-7148-4f95-b8c4-1c6f439132dd',
            refer: params.refer || 'yzjh32'
        }

        if (token) {
            params.access_token = this.cookie.get('token')
        }

        this.ajax({
            url: '/v1/hongbao2/',
            data: params,
            hideError: true,
            noToast: true,
            wl: getWXWL()
        }).then((data) => {
            data = data.data;
            if (data.amount) {
                $('#J_Num').text(data.amount);
                $('.J_Wrapper').hide();
                $('.result-wrapper').show();
            }
        }, (data) => {
            $('.J_Wrapper').hide();
            $('.result-no-wrapper').show();
        });

    }

    _validate(tel) {

        if (!tel) {
            this._showError('请输入手机号码');
            return;
        }

        // 验证手机号，默认是11位  
        if (!/^1[3|4|5|7|8][0-9]\d{8}$/.test(tel)) {
            this._showError('请输入正确的手机号码');

            return;
        }

        return true;
    }

    _showError(msg) {
        this.dialog = new Dialog({
            isShow: true,
            tmpl: this.render(tmpl, {
                content: msg
            }),
            cancleCallback: function() {
                this.destroy();
            }
        });
    }
}

new Lottery();