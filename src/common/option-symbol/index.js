'use strict';

var Cookie = require('../../lib/cookie');
var storage = require('../../app/storage');
var event = require('../../app/event');
var io = require('../../app/io');

module.exports = $.extend(event, {

  remove: function(symbol) {
    var self = this;

    return io.ajax({
      url: '/v1/user/fav/symbol/',
      type: 'delete',
      data: {
        symbol: symbol,
        access_token: Cookie.get('token')
      }
    }).then(function(data) {
      self._del(symbol);
    });
  },

  add: function(symbol) {

    return io.ajax({
      url: '/v1/user/fav/symbol/',
      type: 'post',
      data: {
        symbol: symbol,
        access_token: Cookie.get('token')
      }
    }).then(function(data) {
      self.add = true;

      self._add(symbol);
    });
  },

  _add: function(symbol) {
    var optionList = this._getOptionList();

    if (optionList.indexOf(symbol) === -1) {
      optionList.push(symbol);
      this._setOptionList(optionList);
    }
  },

  _del: function(symbol) {
    var optionList = this._getOptionList();

    var index = optionList.indexOf(symbol);

    if (index !== -1) {
      optionList.splice(index, 1);
      this._setOptionList(optionList);
    }
  },


  _getOptionList: function() {
    var key = this._getKey();

    var optionList = JSON.parse(storage.get(key));

    return optionList;
  },

  isDemo: function() {
    return Cookie.get('type') === 'demo';
  },

  _getKey: function() {
    var key = this.isDemo() ? 'demoOptionList' : 'optionList';
    var token = Cookie.get('token');

    return token + key;
  },

  _setOptionList: function(optionList) {
    var key = this._getKey();
    var optionList = storage.set(key, optionList);
  },

  _saveOptionData: function(data) {
    var optionList = [],
      key = this._getKey();

    $.each(data, function(index, item) {
      var symbol = item.policy.symbol;
      optionList.push(symbol);
    });

    storage.set(key, optionList);

    return optionList;
  }
});