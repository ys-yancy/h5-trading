'use strict';

var Base = require('../../app/base');
var Cookie = require('../../lib/cookie');

function InboxSettings() {
    InboxSettings.superclass.constructor.apply(this, arguments);
    this._init();
}

Base.extend(InboxSettings, Base, {
    _init() {
        this._render();
        this._bind();
    },

    _bind() {
        var doc = $(document);

        doc.on('tap', '.J_Radio', $.proxy(this._radio, this));
    },

    _radio(e) {
        var curEl = $(e.currentTarget),
            parentEl = curEl.parents('.item'),
            index = parentEl.index();
        
        if (curEl.attr('data-permission') == 1) {
            return
        }

        curEl.attr('data-permission', 1);

        var permission = curEl.hasClass('off') ? 1 : 0;
        var params = this._getParams(index, permission);
        
        this._request(params, curEl);
    },

    _request(params, curEl) {
        this.ajax({
            url: '/v1/user/push_config/',
            data: params,
            type: 'POST'
        }).then((data) => {
            curEl.toggleClass('off');
            curEl.attr('data-permission', 0);
        })
    },

    _getParams(index, val) {
        var params = {
            access_token: Cookie.get('token')
        };

        switch(index) {
            case 0:
                params.enable_smart_tips = val;
                break;
            case 1:
                params.enable_marketing = val;
                break;
            case 2:
                params.enable_trade = val;
                break;
            case 3:
                params.enable_bonus = val;
                break;
            case 4:
                params.enable_account = val;
                break;
            case 5:
                params.enable_announce = val;
                break;
            default:
                break;
        }

        return params;
        
    },

    _render() {
        this.ajax({
            url: '/v1/user/push_config/?access_token=' + Cookie.get('token')
        }).then((data) => {
            data = data.data;
            this.render(this.tmpl, data, this.containerEl);
            this.config = data;
        })
    },

    attrs: {
        containerEl: $('.J_Content'),
        tmpl: `
            <div class="item first">
                <p class="title">新消息提醒</p>
                <span class="radio-wrapper ui radio-w J_Radio <%= data.enable_smart_tips == 0 ? 'off' : '' %>"></span>
            </div>
            <div class="item">
                <p class="title">市场类消息提醒</p>
                <span class="radio-wrapper ui radio-w J_Radio <%= data.enable_marketing == 0 ? 'off' : '' %>"></span>
            </div>
            <div class="item">
                <p class="title">交易类消息提醒</p>
                <span class="radio-wrapper ui radio-w J_Radio <%= data.enable_trade == 0 ? 'off' : '' %>"></span>
            </div>
            <div class="item">
                <p class="title">增金类消息提醒</p>
                <span class="radio-wrapper ui radio-w J_Radio <%= data.enable_bonus == 0 ? 'off' : '' %>"></span>
            </div>
            <div class="item">
                <p class="title">账户类消息提醒</p>
                <span class="radio-wrapper ui radio-w J_Radio <%= data.enable_account == 0 ? 'off' : '' %>"></span>
            </div>
            <div class="item">
                <p class="title">公告类消息提醒</p>
                <span class="radio-wrapper ui radio-w J_Radio <%= data.enable_announce == 0 ? 'off' : '' %>"></span>
            </div>
        `
    }
})

new InboxSettings();