/**
 * 加载语言组件
 */
'use strict';
 var Tpl = require('./render');
 var storage = require('./storage');

var globalLangDefers = [];
var globalCachedLang = null;
var globalGetLangReqSent = false;

module.exports = {
    getAppLang: function(tmpl) {
        var self = this;

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
                Tpl.render(tmpl, data, $('body'));
            }

            globalCachedLang = data;

            for (var i = 0, len = globalLangDefers.length; i < len; i++) {
                globalLangDefers[i].resolve(data);
            }

            globalLangDefers = [];

            return data;
        })
    },

    setAppLang: function(lang) {
        if (lang) {
            storage.get('app_lang', lang);
        }

        return lang;
    }
}
