/**
 * 存储引用程序信息
 */

"use strict";

var data = {};

module.exports = {
    save: function(data) {
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                this.set(key, data[key]);
            }
        }
    },

    set: function(key, val) {
        data[key] = val;
    },

    get: function(key) {
        return data[key];
    }
};