"use strict";

var Base = require('../../app/base');

function Loading() {
    Loading.superclass.constructor.apply(this, arguments);
    this.init();
}

Base.extend(Loading, Base, {
    init: function() {
        this._initAttr();
        //this._bind();
    },

    _initAttr: function() {
        if (this.needInit) {
            this.render(tmpl, this.textMsg, this.el);
        }
    },

    _bind: function() {
    },

    show: function() {
        this.el.show();
    },

    hide: function() {
        this.el.hide();
    },

    finish: function(conf) {
        this.hide();
        if (!conf.loadOnce && !conf.isFirst) {
          //  this.render(this.tmpl, this.finishedMsg, this.el);
          //  this.show();
        }
    },

    attrs: {
        finishedMsg: '没有更多数据了!',
        textMsg: '加载中...',
        needInit: true,

        tmpl: '<div class="loading ks-loading"><%= data %></div>'
    }
});

module.exports = Loading;