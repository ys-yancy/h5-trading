var Marquee = function(config) {
    this.el = $(config.el);
    this.list = config.list;
    this.config = config;
    this._initMarquee();
}

Marquee.prototype = {
    constructor: Marquee,

    _initMarquee: function() {
        this._renderHtml();
    },

    _bindEvent: function() {

    },

    _animate: function() {
        var self = this;
        var config = self.config;
        var firstChild = this.html.children().eq(0);
        var height = firstChild.height();
        var RAF = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
            function(c) {
                setTimeout(c, 1 / 60 * 1000);
            };
        
        this.firstChild = firstChild;
          
        RAF(function() {
            var h = config.direction === 'up' ? -height : height;
            var _an = {
                'transitionProperty': '-webkit-transform',
                'transitionTimingFunction': '',
                'transitionDuration': config.delay + 'ms',
                'transform': 'translateY('+ h +'px)'
            }

            self.html.css(_an);

            self._setInvter();
            
            setTimeout(() => {
                self._resetPosition();
            }, config.delay);
        });
    },

    _setInvter: function() {
        setTimeout(() => {
            this._animate();
        }, this.config.duration);
    },

    _resetPosition: function() {
        this.html.append(this.firstChild);
        this.html.css('transitionDuration', '0ms');
        this.html.css('transform', 'translateY(0px)');
    },

    _renderHtml: function() {
        var data = this.list;
        var wrap = document.createElement('UL'),
            html = '';
        for (var i = 0, len = data.length; i < len; i++) {
            var item = data[i];
            html += '<li>' + item.content + '</li>';
        }
        wrap.innerHTML = html;
        this.html = $(wrap);
        this.html.css({
            'transitionProperty': '-webkit-transform',
            'transitionTimingFunction': this.config.easing,
            'transitionDuration': this.config.delay + 'ms',
            'transform': 'translateY(0px)'
        })

        this.el.append(wrap);

        this._setInvter();
    }
}

$.fn.marquee = function(config) {
    config = $.extend({
        // 过度效果
        easing: 'cubic-bezier(0.33, 0.66, 0.66, 1)',

        // 滚动方向 up down
        direction: 'up',

        // 过度时间
        delay: 500,

        //间隔时间
        duration: 2000,

        // 循环次数, 现在没用到
        loop: -1,
        
        // 展示列表
        list: [{content: '我是内容'}, {content: '我是内容'}, {content: '我是内容'}]
    }, config);

    config.el = this;

    return new Marquee(config);
}

module.exports = Marquee;