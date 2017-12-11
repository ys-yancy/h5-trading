/**
 * 自定义事件中心
 */

"use strict";
var _cache = {};

module.exports = {
    _events: {},

    on: function(event, hander, scope) {
        if (!event) {
            return;
        }
        if (typeof hander !== 'function') {
            throw new Error('event handler must be a function.');
        }
        if (!this._events[event]) {
            this._events[event] = [];
        }

        this._events[event].push({
            hander: hander,
            scope: scope
        });
    },

    fire: function(event, data) {
        if (!event) {
            return;
        }
        var registerEvents = this._events[event];
        if (registerEvents) {
            for (var i = 0, len = registerEvents.length; i < len; i++) {
                var registerEvent = registerEvents[i];
                if (registerEvent.scope) {
                    registerEvent.hander.call(registerEvent.scope, data);
                } else {
                    registerEvent.hander.call(this, data);
                }
            }
        }
    },

    off: function(event, handler) {
        if (!event) {
            return;
        }

        var registerEvents = this._events[event];
        if (handler) {
            for (var i = 0, len = registerEvents.length; i < len; i++) {
                if (registerEvents[i] === handler) {
                    registerEvents.splice(i, 1);
                    break;
                }
            }
        } else {
            this._events[event] = null;
        }
    },

    /**
     * 派发
     * @param  {[type]} type 事件类型
     * @param  {[type]}# data 回调数据
     * @return {[type]}      [description]
     */
    broadcast: function(type, data) {
        var listeners = _cache[type],
            len = 0;
        if (undefined !== listeners) {
            var args = [].slice.call(arguments, 0);
            args = args.length > 2 ? args.splice(2, args.length - 1) : [];
            args = [data].concat(args);

            len = listeners.length;
            for (var i = 0; i < len; i++) {
                var listener = listeners[i];
                if (listener && listener.callback) {
                    args = args.concat(listener.args);
                    listener.callback.apply(listener.scope, args);
                }
            }
        }
        return this;
    },
    /**
     * 订阅广播事件
     * @param  {[type]}   types     事件类型，支持,分隔符
     * @param  {Function} callback 回调函数
     * @param  {[type]}   scope    回调函数上下文
     * @return {[type]}            this
     */
    subscribe: function(types, callback, scope) {
        types = types || [];
        var args = [].slice.call(arguments);

        if (typeof types === 'string') {
            types = types.split(',');
        }
        var len = types.length;
        if (len === 0) {
            return this;
        }
        args = args.length > 3 ? args.splice(3, args.length - 1) : [];
        for (var i = 0; i < len; i++) {
            var type = types[i];
            _cache[type] = _cache[type] || [];
            _cache[type].push({
                callback: callback,
                scope: scope,
                args: args
            });
        }
        return this;
    },
    /**
     * 退订
     * @param  {[type]}   type     [description]
     * @param  {Function} callback 假如传入则移出传入的监控事件，否则移出全部
     * @return {[type]}            [description]
     */
    unsubscribe: function(type, callback, scope) {
        var listeners = _cache[type];
        if (!listeners) {
            return this;
        }
        if (callback) {
            var len = listeners.length,
                tmp = [];

            for (var i = 0; i < len; i++) {
                var listener = listeners[i];
                if (listener.callback == callback && listener.scope == scope) {} else {
                    tmp.push(listener);
                }
            }
            listeners = tmp;
        } else {
            listeners.length = 0;
        }
        return this;
    },


    removeAll: function() {
        _cache = {};
        return this;
    }
};