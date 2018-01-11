"use strict";

require('../../lib/zepto');
var PageBase = require('../../app/page-base');
var Dialog = require('../../common/dialog');
var GoBack = require('../../common/go-back');
var Toast = require('../../common/toast');

var tmpl = require('./index.ejs');

class Feedback extends PageBase {
    constructor() {
        super();
        new GoBack();
        this.getToken().then(function() {
            this._bind();
        }.bind(this));
        this.configStatistics();
    }

    _bind() {
        var countEl = $('#J_Count');
        var textareaEl = $('#J_Txt');

        textareaEl.focus();

        textareaEl.on('change keyup keydown', function(e) {
            var curEl = $(e.currentTarget);
            curEl.val(curEl.val().substring(0, 200));
            var length = $(e.currentTarget).val().length;

            var remaind = 200 - length >= 0 ? 200 - length : 0;

            countEl.text(200 - length);
        });

        setInterval(function() {
            textareaEl.val(textareaEl.val().substring(0, 200));
            var length = textareaEl.val().length;

            var remaind = 200 - length >= 0 ? 200 - length : 0;

            countEl.text(200 - length);
        }, 50);

        $('#J_Submit').on('click', $.proxy(function(e) {

            var val = textareaEl.val();

            if (!val) {
                this._showEmpty();
                return;
            }

            this.login().then(function() {
                this._post(val);
            }.bind(this));

        }, this));

        // 添加默认微信分享
        if (this.isWeixin()) {
          this.setupWeiXinShare('default_invite');
        }
    }

    _post(val) {
        this.ajax({
            url: '/v1/feedback/',
            type: 'post',
            data: {
                access_token: this.cookie.get('token'),
                phone: this.cookie.get('phone'),
                contents: val,
                user_id: this.cookie.get('uuid')
            }
        }).then(function(e) {
            new Toast('反馈成功');

            setTimeout(function() {
                location.href = './option.html';
            }, 2000);
        });
    }

    _showEmpty() {
        this.dialog = new Dialog({
            isShow: true,
            tmpl: this.render(tmpl)
        });
    }
}

new Feedback();