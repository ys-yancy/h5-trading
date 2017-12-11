"use strict";

var Base = require('../../app/base');
var Loading = require('./loading');
var ScrollLoad = require('./scroll-load');

function InfinityScroll() {
    InfinityScroll.superclass.constructor.apply(this, arguments);
    this.init();
}

Base.extend(InfinityScroll, Base, {
    init: function() {
        this._initAttrs();
        this._bind();
        this._load();
    },

    _initAttrs: function() {
        this.scrollLoad = new ScrollLoad({
            el: this.el
        });
        this.loading = new Loading(this.loadingConfig);
    },

    _bind: function() {
        // 滚动到页面底部
        this.scrollLoad.on('request:nextPage', $.proxy(this._load, this));
    },

    pause: function() {
        this.scrollLoad.pause();
    },

    resume: function() {
        this.scrollLoad.resume();
    },

    _loading: function(isLoading) {
        if (isLoading) {
            this.loading.show();
        } else {
            this.loading.hide();
            this.scrollLoad.resetLoading();
        }
    },

    _load: function() {
        var params = this._getParams();

        params = $.merge(this.params, params);

        if (this._isLoading()) {
            return;
        }
        this._setLoading(true);

        if (this._hasNext()) {
            this._getData(params);
            this._loading(true);
        } else {
            this._destory();
        }
    },

    _getData: function(params) {
        this._ajax(params);
    },

    _ajax: function(params) {
        var self = this,
            el = this.el,
            v = this.v,
            url = this.url,
            tmpl = this.tmpl,
            emptyTmpl = this.emptyTmpl,
            page = this.page,
            callback = this.callback,
            parse = this.parse;

        this.ajax({
            url: url,
            data: params,
            unjoin: this.unjoin
        }).then(function(data) {
            var data = parse(data, {
                page: self.page,
                pageSize: self.pageSize
            });

            if (!(data && data.data)) {
                return;
            }

            // 内容为空
            if (data.data.length === 0 && page == 0) {
                self._noData(emptyTmpl, data, el);

                callback(data);
                return;
            }
            self.renderTo(tmpl, data.data, el);

            self.hasNextPage = data.hasNextPage === 'true' || data.hasNextPage === true;
            self.page += 1;
            self._loading(false);
            self._setLoading(false);
            callback(data);
        }, function(data) {
            var empty = self.error(data);
            if (empty) {
                self._noData(emptyTmpl, {}, el);
            }
        });
    },

    _noData: function(emptyTmpl, data, el) {
        this.render(emptyTmpl, data.data, el);
        this._destory(true);
        this.empty && this.empty();
    },

    _getParams: function() {
        var params = {
            page: this.page,
            pageSize: this.pageSize
        };

        if (this.beforeRequest && typeof this.beforeRequest === 'function') {
            params = this.beforeRequest(params);
        }

        return params;
    },

    _destory: function(isFirst) {
        var loadOnce = !this.infinite;
        this.scrollLoad.destroy();
        this.loading.finish({
            loadOnce: loadOnce,
            isFirst: isFirst
        });
    },

    // 非无限加载机制，默认只加载一页
    _hasNext: function() {
        if (this.infinite) {
            return this.hasNextPage === true;
        } else {
            return this.page === 0;
        }
    },

    _isLoading: function() {
        return this.isLoading;
    },

    _setLoading: function(isLoading) {
        this.isLoading = !!isLoading;
    },

    attrs: {
        el: null,
        params: {},
        pageSize: 12,
        page: 0,
        hasNextPage: true,
        url: '',
        v: '',
        tmpl: null,
        emptyTmpl: null,
        empty: function() {},
        callback: function() {},
        parse: function(data) {
            return data;
        },
        beforeRequest: function(data) {
            return data;
        },
        error: function(data) {},
        infinite: true,
        isLoading: false
    }
});

module.exports = InfinityScroll;