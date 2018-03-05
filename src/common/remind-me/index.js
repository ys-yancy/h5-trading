'use strict';

require('./index.css');
var Base = require('../../app/base');
var Config = require('../../app/config');
var Cookie = require('../../lib/cookie');
var Dialog = require('../../common/dialog');

function RemindMe() {
    RemindMe.superclass.constructor.apply(this, arguments);
    this._init();
}

Base.extend(RemindMe, Base, {
    _init: function() {
        this._bind();
        this._getMsg();
        this._initDialog();
    },

    _bind: function() {
        this.on('check:get:msg', () => {
            setTimeout(() => {
                this._getMsg();
            }, Config.getRemindTime());
        })
    },

    _lazyBind: function() {
        $('.J_FloatMsg').on('tap', $.proxy(this._showContent, this));
    },

    show: function(data) {
        this._show();
        this._lazyBind();
    },

    hide: function() {
        this._hide();
    },

    _show: function(url) {
        var  msgEl = document.createElement('div'),
            iconEl = document.createElement('a'),
            newMsgEl = document.createElement('span');
        
        msgEl.className = 'float-msg-wrapper ui J_FloatMsg';
        newMsgEl.className = 'float-msg-new ui';
        iconEl.className = 'float-msg ui common icon';
        // iconEl.href = url;

        msgEl.appendChild(iconEl);
        msgEl.appendChild(newMsgEl);
        document.body.appendChild(msgEl);

        this.msgEl = msgEl;
    },

    _hide: function() {
        if (this.msgEl) {
            $(this.msgEl).remove();
        }
    },

    _showContent: function() {
        //var bodyEl = $('body');
        // bodyEl[0].style.cssText = 'overflow:hidden;';
        //this.msgDetailEl = this.renderTo(this.messageTmpl, this.msg, bodyEl);

        //this.msgDetailEl.on('tap', '.J_CloseDetailMsg', () => {
            // bodyEl[0].style.cssText = '';
            // this.msgDetailEl.off('tap');
            // this.msgDetailEl.remove();
        //})

        var dialog = this.msgDialog;
        dialog.setContent(this.msg.content);
        dialog.show();
    },  

    _initDialog: function() {
        this.msgDialog = new Dialog({
            isShow: false,
            tmpl: this.tmpl,
            cancleCallback: $.proxy(function() {
                this._setReadedMsg();
                this.fire('check:get:msg');
            }, this)
        });
    },

    _getMsg: function() {
        this._request().then((msg) => {
            this.show();
            this._setCurMsg(msg)
        }).catch(() => {
            this.fire('check:get:msg');
        })
    },

    _setCurMsg: function(msg) {
        this.msg = msg;
    },

    _setReadedMsg: function() {
        var id = this.msg.id;
        this.ajax({
            url: '/v1/user/smart_tips/'+ id +'/mark_read/',
            type: 'POST',
            data: {
                access_token: Cookie.get('token')
            },
            noToast: true
        }).then(() => {
            this._hide();
        })
    },

    _request: function() {
        return new Promise((resolve, reject) => {
            this.ajax({
                url : '/v1/user/smart_tips/next/?access_token=' + Cookie.get('token'),
                noToast: true
            }).then(function(data) {
                data = data.data;
                if (data.content) {
                    return resolve(data);
                }
                return reject(); 
            }, () => {
                return reject(); 
            })
        })
    },

    attrs: {
        tmpl: `<div class="dialog dialog-float-msg remind-me-wrapper" id="J_Dialog">
                <span class="wrapper-icon"><span class="icon"></span></span>
                <div class="dialog-content">
                    <p class="title">提示</p>
                    <div class="content J_Content"></div>
                </div>
                <div class="dialog-buttons clearfix">
                    <span class="dialog-btn J_DialogClose close" id="J_DialogSetupCancel">我知道了</span>
                </div>
            </div>
            <div class="dialog-mask J_DialogMask"></div>`,

        // messageTmpl: [
        //     '<div class="float-msg-detail">',
        //         '<div class="float-detail-inner">',
        //             '<div class="hd ui header-inner common">',
        //                 '<span class="ui go-back icon J_CloseDetailMsg"></span>',
        //                 '<h2><%= data.title %></h2>',
        //             '</div>',
        //             '<div class="bd ui common content-color">',
        //                 '<p><%= data.content %></p>',
        //             '</div>',
        //         '</div>',
        //     '</div>'
        // ].join('')
    }
});

module.exports = RemindMe;