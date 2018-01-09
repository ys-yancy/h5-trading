'use strict';

require('./index.css');
var Base = require('../../app/base');
var Cookie = require('../../lib/cookie');

function FloatMsg() {
    FloatMsg.superclass.constructor.apply(this, arguments);
    this._init();
}

Base.extend(FloatMsg, Base, {
    _init: function() {
        this._getData();
    },

    _lazyBind: function() {
        $('.J_FloatMsg').on('tap', $.proxy(this._showContent, this));
    },

    show: function(data) {
        if (this._isShow(data)) {

            this._show();
            
            this.currentContent = {
                title: data[0].title,
                content: data[0].content
            }

            this._lazyBind();
        }
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
        var bodyEl = $('body');
        // bodyEl[0].style.height = '100%;';
        // bodyEl[0].style.overflow = 'hidden';
        // bodyEl[0].style.cssText = 'height:0;overflow:hidden;';
        this.msgDetailEl = this.renderTo(this.messageTmpl, this.currentContent, bodyEl);

        this.msgDetailEl.on('tap', '.J_CloseDetailMsg', () => {
            // bodyEl[0].style.cssText = '';
            // bodyEl[0] = null;
            this.msgDetailEl.off('tap');
            this.msgDetailEl.remove();
        })
    },  

    _isShow: function(data) {
        var maxId = data[0] ? data[0].id : undefined;
        var oldId = Cookie.get('announcement_largest_id');
        var isNewMsg = Cookie.get('new_msg');
        var isShow = maxId && maxId != oldId;
        isShow && Cookie.set('announcement_largest_id', maxId);
        return isShow;
    },

    _getData: function() {
        var self = this;
        this.ajax({
            url : '/v1/announcement/list/?access_token=' + Cookie.get('token')
        }).then(function(data) {
            data = data.data;
            self.show(data);
        })
    },

    attrs: {
        messageTmpl: [
            '<div class="float-msg-detail">',
                '<div class="float-detail-inner">',
                    '<div class="hd ui header-inner common">',
                        '<span class="ui go-back icon J_CloseDetailMsg"></span>',
                        '<h2><%= data.title %></h2>',
                    '</div>',
                    '<div class="bd ui common content-color">',
                        '<p><%= data.content %></p>',
                    '</div>',
                '</div>',
            '</div>'
        ].join('')
    }
});

module.exports = FloatMsg;