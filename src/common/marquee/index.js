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

    _start: function() {
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
        var children = this._getAnimeChildren();
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

            self._start();
            
            setTimeout(() => {
                self._resetPos();
            }, config.delay);
        });
    },

    _animateAlign: function() {
        var self = this;
        var config = self.config;
        var children = this._getAnimeChildren();
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
                self._start();
            } else {
                self._animateAlign();
            }
        });

        function reset() {
            CAF(_R);
            self._resetPos();
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
                distance = distance - Math.abs(this.translate);
                break;
            case 'left':
                distance = distance;
                break;
            case 'right':
                distance = distance - Math.abs(this.translate);
                break;
            default: 
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

    _resetPos: function() {
        this._animateAlignDistance = undefined;
        var direction = this.config.direction;

        if (direction === 'down' || direction === 'right') {
            this.rootList.prepend(this.children);
        } else {
            this.rootList.append(this.children);
        }
        
        this.rootList.css('transitionDuration', '0ms');
        this.rootList.css('transform', this.initTransform);
    },

    _getAnimeChildren: function() {
        var childrens = this.rootList.children(),
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

    _getAnimateStyle: function() {
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
            animateStyle = this._getAnimateStyle(),
            translate = 0,
            transform = '';

        switch(direction) {
            case 'up':
                translate = 0;
                transform = 'translateY('+ translate +'px)';
                break;
            case 'down':
                translate = this.el.height() - this._calcHeight(this.rootList);
                transform = 'translateY('+ translate +'px)';
                break;
            case 'left':
                translate = this._calcWidth(this.rootList);
                transform = 'translateX('+ translate +'px)';
                break;
            case 'right':
                translate = this._calcWidth(this.rootList) * -1;
                transform = 'translateX('+ translate +'px)';
                break;
        }

        animateStyle.transform = transform;

        this.rootList.css(animateStyle);

        this.initTransform = transform;
        this.translate = translate;
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
        this.rootList = $(wrap);
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