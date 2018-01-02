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
        this._show();
    },

    show: function() {
        var isNewMsg = Cookie.get('new_msg');
        if (isNewMsg && 1) {
            this._show();
        }
    },

    hide: function() {
        this._hide();
    },

    _show: function() {
        var  msgEl = document.createElement('div'),
            iconEl = document.createElement('a'),
            newMsgEl = document.createElement('span');
        
        msgEl.className = 'float-msg-wrapper ui';
        newMsgEl.className = 'float-msg-new ui';
        iconEl.className = 'float-msg ui common icon';

        msgEl.appendChild(iconEl);
        msgEl.appendChild(newMsgEl);
        document.body.appendChild(msgEl);

        this.msgEl = msgEl;
    },

    _hide: function() {
        if (this.msgEl) {
            $(this.msgEl).remove();
        }
    }
});

module.exports = FloatMsg;