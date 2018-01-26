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
        var direction = this.config.direction;
        switch(direction) {
            case 'up':
                this._animateVertical();
                break;
            case 'down':
                this._animateVertical();
                break;
            case 'right':
                this._animateAlign();
                break;
            case 'left':
                this._animateAlign();
                break;
            default:
                break;
        }
    },

    _animateVertical: function() {
        var self = this;
        var config = self.config;
        var children = this._getBaseChildren();
        var initTranslateY = this._getinitTransLate(children);

        var RAF = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
            function(c) {
                setTimeout(c, 1 / 60 * 1000);
            };
        
        this.children = children;
          
        RAF(function() {
            var h = self._calcAnimateDistance(initTranslateY);

            var _an = {
                'transitionProperty': '-webkit-transform',
                'transitionTimingFunction': '',
                'transitionDuration': config.delay + 'ms',
                'transform': 'translateY('+ h +'px)'
            }

            self.html.css(_an);

            self._setInterval();
            
            setTimeout(() => {
                self._resetPosition();
            }, config.delay);
        });
    },

    _animateAlign: function() {
        var self = this;
        var config = self.config;
        var children = this._getBaseChildren();
        var initTranslateX = this._getinitTransLate(children);
        var calcAnimateDistance = this._calcAnimateDistance(initTranslateX);

        var RAF = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
            function(c) {
                setTimeout(c, 1 / 60 * 1000);
            };

        var CAF = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.clearTimeout;
        
        this.children = children;

        var isPause = false;

        var _R = RAF(function() {
            var x = self._animateAlignDistance !== undefined ? self._animateAlignDistance : calcAnimateDistance;

            if (config.direction === 'left') {
                x = x - config.speed;
                if (x <= -initTranslateX) {
                    reset();
                } else {
                    self._animateAlignDistance = x;
                }
            } else {
                x = x + config.speed;

                if (x >= initTranslateX) {
                    reset()
                } else {
                    self._animateAlignDistance = x;
                }
            }
            
            var _an = {
                'transitionProperty': '-webkit-transform',
                'transitionTimingFunction': '',
                'transform': 'translateX('+ x +'px)'
            }

            self.html.css(_an);

            if (isPause) {
                self._setInterval();
            } else {
                self._animateAlign();
            }
        });

        function reset() {
            CAF(_R);
            self._resetPosition();
            isPause = true;
            self._animateAlignDistance = undefined;
        }
    },

    _calcAnimateDistance: function(distance) {
        var direction = this.config.direction;

        switch(direction) {
            case 'up':
                distance = distance * -1;
                break;
            case 'down':
                distance = distance - Math.abs(this.initDistance);
                break;
            case 'left':
                distance = distance;
                break;
            case 'right':
                distance = distance - Math.abs(this.initDistance);
                break;
        }

        return distance;
    },

    _getinitTransLate: function(curEl) {
        var distance = 0,
            direction = this.config.direction;

        if (!curEl.length) {
            return 0;
        }

        if (direction === 'up' || direction === 'down') {
            distance = this._calcHeight(curEl);
        } else {
            distance = this._calcWidth(curEl);
        }

        return distance;
    },

    _calcWidth: function(curEl) {
        var w = 0;
        if (curEl.length) {
            w = curEl.width();
        }

        return w;
    },

    _calcHeight: function(curEl) {
        var h = 0;
        if (curEl.length) {
            h = curEl.height();
        }

        return h;
    },

    _setInterval: function() {
        var direction = this.config.direction,
            loop = this.config.loop;

        if (loop === 0) {
            return;
        }

        if (loop !== -1) {
            loop--;
            this.config.loop = loop;
        }

        setTimeout(() => {
            this._animate();
        }, this.config.duration);
    },

    _resetPosition: function() {
        this._animateAlignDistance = undefined;
        var direction = this.config.direction;

        if (direction === 'down' || direction === 'right') {
            this.html.prepend(this.children);
        } else {
            this.html.append(this.children);
        }
        
        this.html.css('transitionDuration', '0ms');
        this.html.css('transform', this.initTransform);
    },

    _getBaseChildren: function() {
        var childrens = this.html.children(),
            length = childrens.length,
            firstChild = childrens.eq(0),
            lastChild = childrens.eq(length - 1);

        var direction = this.config.direction;

        if (direction === 'down' || direction === 'right') {
           return lastChild;
        } else {
            return firstChild;
        }

    },

    _calcAnimateStyle: function() {
        var direction = this.config.direction,
            easing = this.config.easing,
            delay = this.config.delay,
            _animate = null;

        if (direction === 'left' || direction === 'right') {
            _animate = {
                'transitionProperty': '-webkit-transform'
            }
        } else {
            _animate = {
                'transitionProperty': '-webkit-transform',
                'transitionTimingFunction': easing,
                'transitionDuration': delay + 'ms'
            }
        }

        return _animate;
    },

    _initStyle: function() {
        var direction = this.config.direction,
            animateStyle = this._calcAnimateStyle(),
            initDistance = 0,
            transform = '';

        switch(direction) {
            case 'up':
                initDistance = 0;
                transform = 'translateY('+ initDistance +'px)';
                break;
            case 'down':
                initDistance = this.el.height() - this._calcHeight(this.html);
                transform = 'translateY('+ initDistance +'px)';
                break;
            case 'left':
                initDistance = this._calcWidth(this.html);
                transform = 'translateX('+ initDistance +'px)';
                break;
            case 'right':
                initDistance = this._calcWidth(this.html) * -1;
                transform = 'translateX('+ initDistance +'px)';
                break;
        }

        animateStyle.transform = transform;

        this.html.css(animateStyle);

        this.initTransform = transform;
        this.initDistance = initDistance;
    },

    _parseList: function(list) {
        var direction = this.config.direction;

        if (direction === 'down' || direction === 'right') {
            list = list.reverse();
        }

        return list;
    },

    _renderHtml: function() {
        var data = this._parseList(this.list);

        var wrap = document.createElement('UL'),
            html = '';
        for (var i = 0, len = data.length; i < len; i++) {
            var item = data[i];
            html += '<li>' + item.content + '</li>';
        }
        wrap.innerHTML = html;
        this.html = $(wrap);
        this.el.append(wrap);
        this._initStyle();
        this._animate();
    }
}

$.fn.marquee = function(config) {
    config = $.extend({
        // 过度效果
        easing: 'cubic-bezier(0.33, 0.66, 0.66, 1)',

        // 滚动方向 up down left right
        direction: 'left',

        // 过度时间
        delay: 500,

        // 移动的距离, 只有在 left/right 下有效
        speed: 2,

        //间隔时间
        duration: 2000,

        // 循环次数, 现在没用到
        loop: -1,
        
        // 展示列表
        list: [{content: '我是内容1'}, {content: '我是内容2'}, {content: '我是内容3'}]
    }, config);

    config.el = this;

    return new Marquee(config);
}

module.exports = Marquee;