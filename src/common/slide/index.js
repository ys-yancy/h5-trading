/**
 * 翻滚组件
 */

"use strict";

var Base = require('../../app/base');

function Slide() {
    Slide.superclass.constructor.apply(this, arguments);
    this.init();
}

Base.extend(Slide, Base, {
    init: function() {
        var hasItem = this._initAttrs();

        if (hasItem) {
            this._start();
        }
    },

    _start: function() {
        var interval = 1500;

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

        var top = -1 * (time * offset);

        itemWrapper.animate({
            top: top
        }, 300, 'ease-out', function() {
            if (time == length) {
                itemWrapper.css('top', 0);
                self.time = 1;
            } else {
                self.time = time + 1;
            }

            self._start();
        });
    },

    _initAttrs: function() {
        var el = this.el,
            itemWrapper = $('.J_ItemWrapper', el),
            items = $('.J_Item', el),
            length = items.length,
            firstEl, height;

        if (length > 1) {
            for (var i = 0; i < this.colspan; i++) {
                firstEl = $(items.get(i)).clone(true);
                itemWrapper.append(firstEl);
            }
            // for (var i = (this.colspan - 1); i >= 0; i--) {
            //     firstEl = $(items.get(i)).clone(true);
            //     itemWrapper.prepend(firstEl);
            // }
            height = $(items.get(0)).height();
            this.offset = height;
            this.itemWrapper = itemWrapper;
            this.length = length;

            return true;
        }

        return false;
    },

    destory: function() {
        clearTimeout(this.timer);
    },

    attrs: {
        time: 1,
        colspan: 1
    }
});

module.exports = Slide;