/**
 * 管理app接口
 */

'use strict';
var storage = require('./storage'); 

var appServerApiDefers = [];
var appServerApiConfig = null;
var appServerApiRequest = false;

function $_glogetApiConfig() {

    if (appServerApiConfig != null) {
        var d = new $.Deferred();
        d.resolve(appServerApiConfig);
        return d;
    }

    var appLocalConfig = storage.get(getWXWL() + '_APP_SERVER_API')
    if (!!appLocalConfig) {
        var d = new $.Deferred();

        appServerApiConfig = JSON.parse(appLocalConfig);
        d.resolve(appServerApiConfig);
        return d;
    }

    if (appServerApiRequest) {
        var d = new $.Deferred();
        appServerApiDefers.push(d);
        return d;
    }

    appServerApiRequest = true;

    return $.ajax({
        url: '../../api/apis.json'
    }).then((data) => {
        data = data.data;
        appServerApiConfig = data;

        storage.set(getWXWL() + '_APP_SERVER_API', data);

        for (var i = 0, len = appServerApiDefers.length; i < len; i++) {
            appServerApiDefers[i].resolve(data);
        }

        appServerApiDefers = [];

        return data;
    })
}

module.exports = {
    getApiConfig(apis) {
        var d = new $.Deferred();

        $_glogetApiConfig().then((data) => {
            if (typeof apis == 'string') {
                var api = data[apis];
                d.resolve(api)
            } else {
                var ret = {};

                for (var i = 0, len = apis.length; i < len; i++) {
                    var key = apis[i];
                    var api = data[key];
                    ret[key] = api;
                }

                d.resolve(ret)
            }
        });

        return d.promise();
    }
 }