/**
 * 翻滚组件
 */

"use strict";

var Base = require('../../app/base');
require('./animate');

function Slide() {
  Slide.superclass.constructor.apply(this, arguments);
  this.init();
}

Base.extend(Slide, Base, {
  init: function() {
    var hasItem = this._initAttrs();

    // if (hasItem) {

    this._start();
    // }
  },

  _start: function() {
    var interval = this.interval !== undefined ? this.interval : 1500;

    var timer = setTimeout($.proxy(this._slide, this), interval);
    this.timer = timer;
  },

  _slide: function() {
    var self = this,
      el = this.el,
      itemWrapper = this.itemWrapper,
      length = this.length,
      offset = this.offset,
      time = this.time;

    if (this.paused) {
      return;
    }

    var left = -1 * (time * offset);

    if (length == 1 || length == 0) {


      setTimeout(() => {
        self.fire('complete');
        self._start();
      }, this.slideInterval || 300);
      return;
    }

    // if (length === 0) {
    //   self._start();

    //   return;
    // }



    if (time === length) {
      self.fire('complete');
    }

    this.fireBefore();

    itemWrapper.animate({
      left: left
    }, this.duration || 300, 'linear', function() {
      if (time == length) {

        itemWrapper.css('left', 0);
        self.time = 0;
      } else {
        self.time = time + 1;
      }

      // self.fire('after', { time: time, curEl: curEl });

      if (self.paused) {
        return;
      }

      self._start();
    });
  },

  add: function(itemEl, index) {
    var items = $('.J_Item', this.el);
    if (index === 0) {
      $(items[this.length]).remove();
      var clone = itemEl.clone();
      var itemWrapper = $('.J_ItemWrapper', this.el);

      itemWrapper.prepend(itemEl);
      itemWrapper.append(clone);

    } else {

      var item = $(items[index - 1]);

      itemEl.insertAfter(item);
    }

    this.length++;


    this.itemWrapper.width(this.offset * (this.length + 1));
    if (this.length > 1) {
      this.resume();
    }

    this.fire('empty', {
      empty: false
    });
  },

  remove: function(index) {
    var items = $('.J_Item', this.el);

    if (index === 0) {
      $(items[this.length]).remove();
      $(items[0]).remove();

      if (this.length > 1) {
        var itemEl = $(items[1]).clone();
        this.itemWrapper.append(itemEl);
      }
      if (this.length < 2) {
        this.pause();
      }
    } else {
      $(items[index]).remove();
    }

    this.length--;
    this.itemWrapper.width(this.offset * (this.length + 1));

    if (this.length == 0) {
      this.fire('empty', {
        empty: true
      });
    }
  },

  pause: function() {
    this.paused = true;
  },

  resume: function() {
    this.paused = false;
    this._start();
  },

  _initAttrs: function() {
    var el = this.el,
      itemWrapper = $('.J_ItemWrapper', el),
      items = $('.J_Item', el),
      length = items.length,
      firstEl, width;

    if (length >= 1) {
      for (var i = 0; i < this.colspan; i++) {
        firstEl = $(items.get(i)).clone();

        itemWrapper.append(firstEl);
      }

      var width = $(items.get(0)).width();
      this.offset = width;
      this.itemWrapper = itemWrapper;
      this.length = length;

      itemWrapper.width(width * length);
      itemWrapper.css('left', 0);

      return true;
    }

    return false;
  },

  fireBefore: function(isFirst) {
    var time = isFirst ? 0 : this.time <= this.length ? this.time : 0;
    var curEl = $('.J_Item', this.el).get(time);

    this.fire('before', { index: time, curEl: curEl, itemEls: $('.J_Item', this.el) });
  },

  destory: function() {
    clearTimeout(this.timer);
    this.off('complete');
  },

  attrs: {
    time: 1,
    colspan: 1
  }
});

module.exports = Slide;