var Base = require('../../app/base');

var touchSlider = function(options) {
  var self = this;
  $.extend(this, {
    width: null, //默认null，宽度根据内容宽度而定；[0.8|330|function(){ return x+y;}]；可为百分比（相对于屏幕的宽度）、固定宽度、动态计算的宽度
    container: ".km-slider", //大容器，包含面板元素、触发元素、上下页等
    wrap: '.km-slider-outer', //滑动显示区域，默认为container的第一个子元素。（该元素固定宽高overflow为hidden，否则无法滑动）
    panel: null, //面板元素，默认为wrap的第一个子元素
    hasNav: true, //是否需要导航触发器，默认有，几个小圆圈
    navCls: 'km-slider-nav', //导航触发器类名
    activeNavCls: 'sel', //触发元素内子元素的激活样式
    navEvent: 'tap', //导航触发切换的事件，默认为tap
    colspan: 1, //每次滑块的跨度，每次滑动几个panels，默认1
    curIndex: 0, //初始化在哪个panels上，默认0为第一个
    duration: 300, //动画持续时间
    loop: true, //循环播放
    play: true, //动画自动播放,
    slidePlay: true, // 是都可以活动播放
    interval: 5000, //播放间隔时间，play为true时才有效
    isAdaptWindowChange: true, //是否需要自适应窗口宽度变化（resize/orientationchange），默认支持
    ready: null, //初始化完成后回调函数
    beforeSlide: null, //初始化完成后回调函数
    slide: null, //即将切换
    afterSlide: null //切换后
  }, options);

  //webp.isSupport(function(isSupport){
  self.isSupportWep = false;
  self.init();
  //});

  return this;
};

$.extend(touchSlider.prototype, {
  init: function() {
    this._setPublicProp(); //预处理公共静态变量
    this._initLoadImg(this.curIndex); //加载当前屏图片
    this._readyForLoop(); //循环播放复制帧
    this._initStyle(); //初始化各元素的style

    if ($.isFunction(this.ready)) {
      this.ready.call(this, this);
    }
    if (this._pages <= this.colspan) { //如果没超出一页，则不需要滑动
      for (var i = 0; i < this._pages; i++) {
        this.getImg(this.panels[i]); //存在一页的则显示第一页
      }
      return;
    }
    this._dealNav();
    this._increaseEvent();
    this.isAdaptWindowChange && this._windowChange();
  },

  _windowChange: function() {
    var self = this;
    var events = ['resize', 'orientationchange'];
    $.each(events, function(key, event) {
      window.addEventListener(event, function() {
        if (self._timer && clearTimeout(self._timer));
        self._timer = setTimeout(function() {
          var oldViewportWidth = self.viewportWidth;
          self.viewportWidth = document.body.offsetWidth;
          self._setAdaptiveWidth();
          self._initStyle();
          //屏幕宽度变小 直接用原来的大图缩小显示，不需要切换图片，浪费流量
          if (oldViewportWidth < self.viewportWidth) {
            self.hasLoadPages = []; //清空重新加载图片
          }
          self.smartLoadImg();
        }, 300);
      });
    });
  },
  /**
   * _setPublicProp 统一set属性
   */
  _setPublicProp: function() {
    var container = this.container = $(this.container);
    if (!container.length) {
      return;
    }

    this.wrap = this.wrap && container.find(this.wrap) || container.children().first();
    if (!this.wrap.length) {
      return;
    }

    this.panel = this.panel && container.find(this.panel) || this.wrap.children().first();
    if (!this.panel.length) {
      return;
    }
    this.panels = this.panel.children();
    this.len = this.panels.length;

    if (!this.panels.length) { //对于没有图片的元素，直接隐藏
      this.container.hide();
      return;
    }
    this._pages = Math.ceil(this.len); //总页数

    this._minpage = 0; //最小页
    this._maxpage = this._pages - 1; //最大页
    this._stopMove = false;
    this.viewportWidth = document.body.offsetWidth;
    this._setAdaptiveWidth();

    var isSupport3D = this._isSupport3D();
    this.gv1 = isSupport3D ? 'translate3d(' : 'translate(',
      this.gv2 = isSupport3D ? ',0)' : ')';
    this.hasLoadPages = []; //用来缓存已经加载过的页码
  },

  _setAdaptiveWidth: function() {

    var adaptiveWidth = this.width;
    if (adaptiveWidth) {
      if ($.isFunction(adaptiveWidth)) {
        adaptiveWidth = adaptiveWidth();
      } else if (adaptiveWidth <= 1) {
        adaptiveWidth = Math.ceil(adaptiveWidth * this.viewportWidth);
      }
      this.adaptiveWidth = adaptiveWidth;
    }
  },
  /**
   * _isSupport3D 是否支持3D
   * @return {Boolean}
   */
  _isSupport3D: function() {
    var style,
      ret = false,
      div = document.createElement('div'),
      style = ['&#173;', '<style id="smodernizr">', '@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}', '</style>'].join(''),
      mStyle = document.documentElement.style;
    div.id = 'modernizr';
    div.innerHTML += style;
    document.body.appendChild(div);
    if ('WebkitPerspective' in mStyle && 'webkitPerspective' in mStyle) {
      ret = (div.offsetLeft === 9 && div.offsetHeight === 3);
    }
    div.parentNode.removeChild(div);
    return ret;
  },
  /**
   * _initStyle 初始化各元素样式
   * @return {[type]} [description]
   */
  _initStyle: function() {
    var self = this,
      panel = self.panel,
      panels = self.panels,
      singlePanel = panels[0],
      singlePanelWidth = singlePanel.offsetWidth,
      adaptiveWidth = self.adaptiveWidth,
      len = this.len;

    adaptiveWidth && panel.children().css('width', adaptiveWidth);

    self.wrap.css({
      'width': adaptiveWidth || self.colspan * singlePanelWidth,
      'height': singlePanel.offsetHeight
    });
    this.steps = self.adaptiveWidth || singlePanelWidth; //滑动步长
    //循环播放 +2 前后各复制一帧

    if (self.loop) {
      len = this.len + 2 * self.colspan;
    }
    //有可能图片加载慢，子容器高度未定，加timer监听修正高度，5s后取消定时器
    self._addHeightTimmer();
    setTimeout(function() {
      self._removeHeightTimmer();
    }, 5000);

    panel.css({
      'width': adaptiveWidth * len || singlePanelWidth * len,
      '-webkit-backface-visibility': 'hidden',
      'position': 'relative'
    });
    if (this._pages <= this.colspan) return;
    var offStep = self.loop ? self.colspan : 0;
    self.setCoord(panel, 0 - (self.curIndex + offStep) * self.steps);
  },

  _removeHeightTimmer: function() {
    var self = this;
    if (self.heightTimmer) {
      clearInterval(self.heightTimmer);
      self.heightTimmer = null;
    }
  },
  /**
   * _addHeightTimmer 增加动态监控wrap高度的定时器
   * 图片没加载完时，得到的高度未知 wrapperCon在很多时候高度是可变的
   */
  _addHeightTimmer: function() {
    var self = this;
    if (self.heightTimmer) {
      clearInterval(self.heightTimmer);
      self.heightTimmer = null;
    }

    var resetHeight = function() {
      var curHeight = self.panels[0].offsetHeight;
      if ((self._panelHeight != curHeight && curHeight != 0) || !self._panelHeight) {
        self._panelHeight = curHeight;
        self.wrap.css({
          height: curHeight
        });
      }
    };

    self.heightTimmer = setInterval(resetHeight, 100);
    resetHeight();
  },
  //循环播放图片 处理首尾相连的图片
  _readyForLoop: function() {
    if (!this.loop || this._pages <= this.colspan) return;
    var self = this,
      panel = self.panel,
      panels = self.panels,
      //复制首尾以便循环
      colspan = self.colspan,
      extraPannels = [],
      len = self.len;
    for (var i = 0; i < colspan; i++) {
      var firstp = panels[i].cloneNode(true);
      panel.append(firstp);
      extraPannels.push(firstp);
      var lastp = panels[len - 1 - i].cloneNode(true);
      panel.prepend(lastp);
      extraPannels.push(lastp);
    }
    //适当的时间再加载循环复制的图片 小于动画停留时间5000 预估3500后渲染图片 有问题 当初始化显示最后一张图片时
    var durationTime = self.interval;
    var laterTime = durationTime - 1500 < 0 ? durationTime - 1500 : durationTime;
    window.setTimeout(function() {
      $.each(extraPannels, function(idx, item) {
        self.getImg(item);
      });
    }, durationTime);
  },

  /**
   * dealNav 处理导航触发器相关
   * @return
   */
  _dealNav: function() {
    if (!this.hasNav) return;
    var nav = this.navCls && this.container.find('.' + this.navCls);
    if (this._pages <= 1) {
      nav && nav.hide;
      return;
    }
    //如果触发容器不存在，自动添加触发容器和子元素
    if (nav.length == 0) {
      var navCls = this.navCls;
      this.wrap.append('<div class="' + navCls + '">' + this._createNavs() + '</div>');
      nav = this.nav = this.container.find('.' + navCls);
    } else {
      //如果触发容器存在，触发容器无子元素则添加子元素
      var childstu = nav.children();
      if (!childstu.length) {
        nav.html(this._createNavs());
      } else {
        $(childstu[this.curIndex]).addClass(this.activeNavCls);
      }
    }
    this.navs = nav.children();
    this.navSel = this.navs[this.curIndex]; //当前状态元素
    return this;
  },

  _createNavs: function() {
    var temp = '',
      pages = this._pages; //总页数
    for (var i = 0; i < pages; i++) {
      temp += '<span' + (i == this.curIndex ? " class=" + this.activeNavCls + "" : "") + '></span>';
    }
    return temp;
  },

  _increaseEvent: function() {
    var self = this,
      _panel = self.wrap[0], //外层容器
      navs = self.navs;
    if (_panel.addEventListener && self.slidePlay) {
      var events = 'touchstart touchmove touchend webkitTransitionEnd msTransitionEnd oTransitionEnd transitionend'.split(' ');
      for (var p in events) {
        _panel.addEventListener(events[p], self, false);
      }
    }
    if (self.play) {
      self.begin();
    }

    //改成代理
    if (self.hasNav && navs) {
      navs.each(function(n, item) {
        $(item).on(self.navEvent, function() {
          self.goto(n);
        });
      });
    }
  },
  handleEvent: function(e) {
    switch (e.type) {
      case 'touchstart':
        this.start(e);
        break;
      case 'touchmove':
        this.move(e);
        break;
      case 'touchend':
      case 'touchcancel':
        this.end(e);
        break;
      default:
        this.transitionEnd(e);
        break;
    }
  },

  _initLoadImg: function(curIndex) {
    var colspan = this.colspan;
    for (var i = 0; i < colspan; i++) {
      this.loadImg(i + curIndex);
    }
    this.preLoad(curIndex - 1);
    this.preLoad(curIndex + colspan);
  },

  smartLoadImg: function(n) {
    n = n || 0;
    var self = this;
    //if(self.colspan)
    self.loadImg(n);
    //加载第一屏的时候，准备加载第二屏，和上一屏，防止左右动画切换过程中图片还没准备好
    self.preLoad(n - 1);
    self.preLoad(n + self.colspan);
  },

  preLoad: function(i) {
    var self = this;
    setTimeout(function() {
      self.loadImg(i);
    }, 500);
  },

  loadImg: function(n) { //判断加载哪屏图片
    n = n || 0;
    var min = this._minpage,
      max = this._maxpage;
    if (n < min) {
      n = max + n + 1;
    } else if (n > max) {
      n = n - max - 1;
    }
    //判断该屏图片是否已经加载过
    if ($.inArray(n, this.hasLoadPages) > -1) return;

    var panels = this.panels;
    this.getImg(panels[n]);

    this.hasLoadPages.push(n);
  },

  getImg: function(obj) { //加载图片

  },

  // 设置图片src
  setSrc: function(img, src) {

    img.attr('src', src);
  },

  start: function(e) { //触摸开始
    this._startTouchTime = new Date().getTime();
    var et = e.touches[0];
    this._movestart = undefined;
    this._disX = 0;
    this._coord = {
      x: et.pageX,
      y: et.pageY
    };
  },
  disableMove: function() {
    this._stopMove = true;
  },
  enableMove: function() {
    this._stopMove = false;
  },
  move: function(e) {
    // console.log(this._stopSlide);
    //滑动太快，停下来不动
    //if(this._endTouchTime && this._startTouchTime && this._startTouchTime - this._endTouchTime < 500) return;

    if (e.touches.length > 1 || e.scale && e.scale !== 1) return;
    var et = e.touches[0],
      disX = this._disX = et.pageX - this._coord.x,
      tmleft;
    if (typeof this._movestart == 'undefined') { //第一次执行touchmove
      this._movestart = !!(this._movestart || Math.abs(disX) < Math.abs(et.pageY - this._coord.y));
    }
    if (!this._movestart) { //不是上下
      e.preventDefault();
      this.stop();
      if (!this.loop) { //不循环
        disX = disX / ((!this.curIndex && disX > 0 || this.curIndex == this._maxpage && disX < 0) ? (Math.abs(disX) / this.steps + 1) : 1); //增加阻力
      }
      var offStep = this.loop ? this.colspan : 0,
        tmleft = 0 - (this.curIndex + offStep) * this.steps + disX;
      if (!this._stopMove) {
        this.setCoord(this.panel, tmleft);
      }
      this._disX = disX;
    }
  },

  end: function(e) {
    //滑动太快，滚回去不翻页
    if (this._endTouchTime && this._startTouchTime && this._startTouchTime - this._endTouchTime < 300) {
      this._endTouchTime = new Date().getTime();
      var offStep = this.loop ? this.colspan : 0;
      tmleft = 0 - (this.curIndex + offStep) * this.steps;
      this.setCoord(this.panel, tmleft);
      return;
    }
    this._endTouchTime = new Date().getTime();
    if (!this._movestart) { //如果执行了move
      var distance = this._disX;
      if (distance < -10) {
        e.preventDefault();
        this.next();
      } else if (distance > 10) {
        e.preventDefault();
        this.previous();
      }
      distance = null;
    }
  },

  previous: function(callback) {
    var cur = this.curIndex,
      minp = this._minpage;
    cur -= 1;
    if (cur < minp) {
      if (!this.loop) {
        cur = minp;
      } else {
        cur = minp - 1;
      }
    }
    this.goto(cur, callback);
  },

  next: function(callback) {

    var cur = this.curIndex,
      maxp = this._maxpage;
    cur += 1;
    if (cur > maxp) {
      if (!this.loop) {
        cur = maxp;
      } else {
        cur = maxp + 1;
      }
    }
    this.goto(cur, callback);
  },

  setCoord: function(obj, x) {
    obj.css("-webkit-transform", this.gv1 + x + 'px,0' + this.gv2);
  },


  goto: function(cur, callback) {
    if (callback && $.isFunction(callback)) callback.call(this, this);

    this.nextIndex = cur || 0;

    var beforeSlide = this.beforeSlide;
    if (beforeSlide && $.isFunction(beforeSlide)) {
      if (beforeSlide.call(this, this) == false) {
        return;
      }
    }
    //通过事件注册 beforeSlide是异步的，不支持返回值false时，return;
    this.container.trigger('beforeSlide', {
      index: cur,
      navnode: this.navSel,
      pannelnode: $(this.panels[cur])
    });

    cur = cur || 0;
    this.curIndex = cur; //保存当前屏数

    var panel = this.panel,
      style = panel[0].style,
      offStep = this.loop ? this.colspan : 0,
      scrollx = 0 - (cur + offStep) * this.steps;
    this.smartLoadImg(cur);
    style.webkitTransitionDuration = style.MozTransitionDuration = style.msTransitionDuration = style.OTransitionDuration = style.transitionDuration = this.duration + 'ms';
    this.setCoord(panel, scrollx);
    if (this.loop) { //把curIndex和坐标重置
      if (cur > this._maxpage) {
        this.curIndex = 0;
      } else if (cur < this._minpage) {
        this.curIndex = this._maxpage;
      }
    }
    var slide = this.slide;
    if (slide && $.isFunction(slide)) slide.call(this, this);
    this.container.trigger('slide', {
      index: this.curIndex,
      navnode: this.navSel,
      pannelnode: $(this.panels[this.curIndex])
    });
    this.update();
  },

  transitionEnd: function(e) {
    var panel = this.panel,
      style = panel[0].style,
      loop = this.loop,
      cur = this.curIndex;

    //css transtionEnd会触发多次，在以下情况1.slider中含有css3动画，slider中含有播放的video，如果index不改变则不触发。
    if (this.lastCurIndex && this.lastCurIndex == cur) return;
    this.lastCurIndex = cur;

    if (loop) { //把curIndex和坐标重置
      this.setCoord(panel, 0 - (this.curIndex + this.colspan) * this.steps);
    }
    if (!loop && cur == this._maxpage) { //不循环的，只播放一次
      this.stop();
      this.play = false;
    } else {
      this.begin();
    }

    style.webkitTransitionDuration = style.MozTransitionDuration = style.msTransitionDuration = style.OTransitionDuration = style.transitionDuration = 0;
    var afterSlide = this.afterSlide;
    if (afterSlide && $.isFunction(afterSlide)) afterSlide.call(this, this);
    this.container.trigger('afterSlide', {
      index: this.curIndex,
      navnode: this.navSel,
      pannelnode: $(this.panels[this.curIndex])
    });
  },

  update: function() {
    var navs = this.navs,
      cls = this.activeNavCls,
      curIndex = this.curIndex;
    if (navs && navs[curIndex]) {
      this.navSel && (this.navSel.className = '');
      navs[curIndex].className = cls;
      this.navSel = navs[curIndex];
    }
  },

  begin: function() {
    var self = this;
    if (self.play && !self._playTimer) { //自动播放
      self.stop();
      self._playTimer = setInterval(function() {
        self.next();
      }, self.interval);
    }
  },

  stop: function() {
    var self = this;
    if (self.play && self._playTimer) {
      clearInterval(self._playTimer);
      self._playTimer = null;
    }
  },

  destroy: function() {
    var self = this,
      _panel = self.wrap[0],
      navs = self.navs;
    if (_panel.removeEventListener) {
      _panel.removeEventListener('touchstart', self, false);
      _panel.removeEventListener('touchmove', self, false);
      _panel.removeEventListener('touchend', self, false);
      _panel.removeEventListener('webkitTransitionEnd', self, false);
      _panel.removeEventListener('msTransitionEnd', self, false);
      _panel.removeEventListener('oTransitionEnd', self, false);
      _panel.removeEventListener('transitionend', self, false);
    }
    if (self.hasNav && navs) {
      navs.each(function(n, item) {
        $(item).off(self.navEvent);
      });
    }
  }
});

$.fn.slider = function(options) {
  var options = options || {};
  options.container = this;
  var slider = new touchSlider(options);
  return slider;
};

module.exports = touchSlider;