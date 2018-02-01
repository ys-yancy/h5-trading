var CustomEvent = require('./event');
var Tpl = require('./render');
var Io = require('./io');
// var Api = require('./api');
var extend = require('./extend');
var Weixin = require('./weixin');
var Statistics = require('./statistics');

function Base() {
  var config = arguments[0] || {};
  var attrs = this.attrs || {};
  var states = this.states || {};

  if (typeof this.defaults === 'function') {
    var defaults = this.defaults();
    initAttrs(this, defaults);
  }




  initAttrs(this, attrs);
  initAttrs(this, states, true);
  initAttrs(this, config);

  // 在html里提供webpack对象的入口
  window.webpackObject = this;

  this._events = {};
}

Base.prototype.constructor = Base;
Base.extend = extend;


$.extend(Base.prototype, Tpl);
$.extend(Base.prototype, CustomEvent);
$.extend(Base.prototype, Io);
// $.extend(Base.prototype, Api);
$.extend(Base.prototype, Weixin);
$.extend(Base.prototype, Statistics);


function initAttrs(obj, attrs, isDefine) {
  var val, getter, setter;

  for (var key in attrs) {
    if (attrs.hasOwnProperty(key)) {
      val = attrs[key];

      if (isDefine) {
        if ($.isPlainObject(attrs[key]) && isConfigObj(attrs[key])) {
          val = attrs[key].value;
          getter = attrs[key].getter;
          setter = attrs[key].setter;
        }
        defineProperty(obj, key, val, getter, setter);
      }

      obj[key] = val;
    }
  }
}

function isConfigObj(obj) {
  return $.isFunction(obj.setter) || $.isFunction(obj.getter);
}

function defineProperty(obj, key, val, getter, setter) {
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,

    get: function() {
      if (getter && $.isFunction(getter)) {
        return getter(val);
      } else {
        return val;
      }
    },
    set: function(value) {
      if (val !== value) {
        var upperKey = upperCase(key);
        var eventType = 'before' + upperKey + 'Change';

        this.fire(eventType, {
          curVal: val,
          newVal: value
        });

        var preVal = val;

        if (setter && $.isFunction(setter)) {
          val = setter(value);
        } else {
          val = value;
        }

        eventType = 'after' + upperKey + 'Change';
        this.fire(eventType, {
          curVal: val,
          preVal: preVal
        });
      }
    }
  });
};

function upperCase(word) {
  return word.substring(0, 1).toUpperCase() + word.substring(1);
}

$.merge = function(target) {
  var deep, slice = [].slice,
    args = slice.call(arguments, 1),
    ret = {}
  if (typeof target == 'boolean') {
    deep = target
    target = args
  } else {
    target = slice.call(arguments, 0)
  }
  $.extend.apply($, [!!deep, ret].concat(target))
  return ret;
};

module.exports = Base;