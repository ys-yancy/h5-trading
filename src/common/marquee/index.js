var Marquee = function(config) {
    this.el = $(config.el);
    this.list = config.list;
    this.config = config;
    this._initMarquee();
}

Marquee.prototype = {
    constructor: Marquee,

    _initMarquee: function() {
        this._requires();
        this._renderHtml();
    },

    _bindEvent: function() {

    },

    _start: function() {
        var direction = this.config.direction,
            loop = this.config.loop,
            isBroadcastCallback = this.config.isBroadcastCallback,
            startBroadcastCallback = this.config.startBroadcastCallback,
            marqueeLoadedCallback = this.config.marqueeLoadedCallback;

        if (this.isPause) {
            return false;
        }

        if (loop === 0) {
            isBroadcastCallback && marqueeLoadedCallback(this.currentSilderEl);
            return;
        }

        if (loop !== -1) {
            loop--;
            this.config.loop = loop;
        }

        this._startTimer = setTimeout(() => {
            this._animate();
            isBroadcastCallback && startBroadcastCallback(this.currentSilderEl);
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
        
        this.currentSilderEl = children;

        this._reqAf = requestAnimationFrame(function() {
            var translateY = self._calcAnimateDistance(initTranslateY);

            var _an = {
                'transitionProperty': '-webkit-transform',
                'transitionTimingFunction': '',
                'transitionDuration': config.delay + 'ms',
                'transform': 'translateY('+ translateY +'px)'
            }

            self.rootList.css(_an);
            
            setTimeout(function() {
                cancelAnimationFrame(self._reqAf);
                self._resetPos();
                self._start();
            }, config.delay)    
        });
    },

    _animateAlign: function() {
        var self = this;
        var direction = self.config.direction;
        var children = this._getAnimeChildren();
        var initTranslateX = this._getinitTransLate(children);
        
        this.currentSilderEl = children;

        if (this.isPause) {
            return false;
        }

        var isRestart = false;

        this._reqAf = requestAnimationFrame(function() {
            var translateX = self._calcAnimateDistance(initTranslateX);
            if (direction === 'left') {
                if (translateX <= -initTranslateX) {
                    reset();
                }
            } else {
                if (translateX >= initTranslateX) {
                    reset()
                }
            }
  
            var _an = {
                'transitionProperty': '-webkit-transform',
                'transitionTimingFunction': '',
                'transform': 'translateX('+ translateX +'px)'
            }

            self.rootList.css(_an);

            if (isRestart) {
                self._start();
            } else {
                self._animateAlign();
            }
        });

        function reset() {
            cancelAnimationFrame(self._reqAf);
            self._resetPos();
            isRestart = true;
            self._animateAlignDistance = undefined;
        }
    },

    _calcAnimateDistance: function(distance) {
        var direction = this.config.direction,
            speed = this.config.speed;

        switch(direction) {
            case 'up':
                distance = distance * -1;
                break;
            case 'down':
                distance = distance - Math.abs(this.translate);
                break;
            case 'left':
                distance = this._animateAlignDistance !== undefined  ? this._animateAlignDistance : distance;
                distance = distance - speed;
                this._animateAlignDistance = distance;
                break;
            case 'right':
                distance = this._animateAlignDistance !== undefined  ? this._animateAlignDistance : distance - Math.abs(this.translate);
                distance = distance + speed;
                this._animateAlignDistance = distance;
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
        var direction = this.config.direction,
            isBroadcastCallback = this.config.isBroadcastCallback,
            loadBroadcastedCallback = this.config.loadBroadcastedCallback;

        this._animateAlignDistance = undefined;

        if (direction === 'down') {
            this.rootList.prepend(this.currentSilderEl);
        } else {
            this.rootList.append(this.currentSilderEl);
        }
        
        this.rootList.css('transitionDuration', '0ms');
        this.rootList.css('transform', this.initTransform);

        isBroadcastCallback && loadBroadcastedCallback(this.currentSilderEl);
    },

    _getAnimeChildren: function() {
        var childrens = this.rootList.children(),
            length = childrens.length,
            firstChild = childrens.eq(0),
            lastChild = childrens.eq(length - 1);

        var direction = this.config.direction;

        if (direction === 'down') {
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

        if (direction === 'down') {
            list = list.reverse();
        }

        return list;
    },

    _renderHtml: function() {
        var config = this.config;
        var data = this._parseList(this.list);

        var wrap = document.createElement('UL'),
            html = '';
        for (var i = 0, len = data.length; i < len; i++) {
            var item = data[i],
                url = item.url;
            if (url) {
                html += '<li class="'+ config.itemClass +'"><a href='+ url +'>' + item.content + '</a></li>';
            } else {
                html += '<li class="'+ config.itemClass +'">' + item.content + '</li>';
            }
            
        }

        wrap.innerHTML = html;
        wrap.className = config.containerClass;
        this.rootList = $(wrap);

        this.el.append(wrap);
        this._initStyle();
        this._start();
    },

    pause: function() {
        this.isPause = true;
        clearTimeout(this._startTimer);
        cancelAnimationFrame(this._reqAf);
    },

    resume: function() {
        this.isPause = false;
        this._start();
    },

    destroy: function() {
        this.el = null;
        this.list = null;
        this.config = null;
        this.currentSilderEl = null;
        this._animateAlignDistance = null;
        this.rootList.remove();
        clearTimeout(this._startTimer);
        cancelAnimationFrame(this._reqAf);
    },

    _requires: function() {
        window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
            function(c) {
                setTimeout(c, 1 / 60 * 1000);
            };

        window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.clearTimeout;
    }
}

$.fn.marquee = function(config) {
    config = $.extend({
        el: this,

        // 容器类名
        containerClass: 'cm-marquee-outer',

        // 消息类名
        itemClass: 'cm-marquee-item',

        // 展示列表
        list: [{content: '我是内容1', url: '1111'}, {content: '我是内容2'}, {content: '我是内容3'}],

        // 过度效果
        easing: 'cubic-bezier(0.33, 0.66, 0.66, 1)',

        // 滚动方向 up down left right
        direction: 'up',

        // 过度时间
        delay: 500,

        // 移动的距离, 只有在 left/right 下有效
        speed: 2,

        //间隔时间
        duration: 2000,

        // 循环次数, -1代表无限循环
        loop: -1,

        // 是否触发回调
        isBroadcastCallback: false,

        // 信息播放完前回调
        startBroadcastCallback: function() {
            console.log('startBroadcast')
        },
        // 当前信息播放完毕回调
        loadBroadcastedCallback: function() {
            console.log('loadBroadcasted')
        },
        // marquue 播报完毕回调 // looo = -1是不会触发
        marqueeLoadedCallback: function() {
            console.log('marqueeLoaded')
        },
    }, config);

    return new Marquee(config);
}

module.exports = Marquee;