/**
 * 加载语言组件
 * 优先使用localstorage 其次 globalCachedLang
 */
'use strict';
 var Tpl = require('./render');
 var storage = require('./storage');

var globalLangDefers = [];
var globalCachedLang = null;
var globalGetLangReqSent = false;

module.exports = {
    initAppLang: function(tmpl) {
        if (globalCachedLang != null) {
            console.log("globalCachedLang != null");
            var d = new $.Deferred();
            d.resolve(globalCachedLang);
            return d;
        }

        if (globalGetLangReqSent) {
            console.log("globalLangDefers == true");
            var d = new $.Deferred();
            globalLangDefers.push(d);
            return d;
        }

        var currentLang = storage.get('app_lang');

        globalGetLangReqSent = true;
 
        return $.ajax({
            url: '../../api/login.json'
        }).then(function(data) {

            if (tmpl) {
                var html = Tpl.render(tmpl, data);

                $('body').prepend(html);
            }

            globalCachedLang = data;

            for (var i = 0, len = globalLangDefers.length; i < len; i++) {
                globalLangDefers[i].resolve(data);
            }

            globalLangDefers = [];

            return data;
        })
    },

    get: function() {

    },

    set: function(lang) {
        if (lang) {
            storage.get('app_lang', lang);
        }

        return lang;
    }
}
