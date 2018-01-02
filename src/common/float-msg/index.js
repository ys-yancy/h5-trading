'use strict';

require('./index.css');
var Base = require('../../app/base');

function FloatMsg() {
    FloatMsg.superclass.constructor.apply(this, arguments);
    this._init();
}

Base.extend(FloatMsg, Base, {
    _init: function() {
        this._show();
    },

    show: function() {

    },

    hide: function() {

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
    },

    _hide: function() {

    }
});

module.exports = FloatMsg;