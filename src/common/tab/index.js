var flip = require('./flipsnap');

// 构造函数
function Tab(config) {

  this.config = $.extend({
    el: '#J_Test', //必填，Tab容器
    activeCls: 'km-active', //选中class
    triggers: '.km-tab-trigger', //触点class
    contents: '.km-tab-content', //内容区class
    contentShare: false, //是否开启内容区共用
    contentScroll: false, //开启内容区滚动
    type: 'normal', //'normal','time','flat'
    activePos: '1x', //'left','center','1x','2x','custom num'
    random: false, //是否随机切换
    position: 'top', // 'top','bottom','left','right'
    delay: 0, // 延迟切换,毫秒
    effect: 'fadeIn', // 切换动画效果
    scrollable: true, //Tab触点是否可以滚动
    autoSwitch: true, //是否自动切换
    onSwitch: null //切换回调
  }, config);

  this.constructor = Tab;
  this.eventHandler = $({}); //事件处理对象

  this.init();

}

$.extend(Tab.prototype, {
  /*初始化*/
  init: function() {

    if (this.inited) return;

    this.render();

    this.bind();

    if (this.config.autoSwitch) this.moveTo();

    this.inited = true;

  },
  render: function() {
    this.container = $(this.config.el);


    this.container.addClass('km-tab');

    var data = this.config.data;
    console.log(data);

    if ($.isArray(data) && data.length) {
      data.share = !!this.config.contentShare;
      data.less = !!this.config.contentLess;
      this.container.append($(tmpl({
        data: data
      })));
    }

    this.triggers = $(this.config.triggers, this.container);
    this.contents = $(this.config.contents, this.container);

    this.triggers.parent().addClass('km-tab-' + (this.config.type || 'normal'));

    this.lens = this.triggers.length;

    this.setWidth();

    this.setContents();

    this.trigger('afterRender');
  },
  /* 设置触点宽度及滚动对象 */
  setWidth: function() {
    var triggersWidth = 0;
    var triggersWrap = this.triggers.parent(); //触点容器
    var len = this.lens;

    this.triggers.forEach(function(trigger, i) {
      triggersWidth += $(trigger).width();
    });
    this.singleWidth = Math.round(triggersWidth / len) //每个触点宽度固定，取单个触点宽度

    if (this.config.scrollable && triggersWidth > this.container.width()) {

      triggersWrap.width(triggersWidth);
      this.flip = this.flip || flip(triggersWrap[0], {
        distance: (triggersWrap.width() - triggersWrap.parent().width()) / len,
        maxPoint: this.triggers.length
      });

      this.flip.refresh();

    } else {

      this.triggers.forEach(function(trigger, i) {
        $(trigger).css('width', 100 / len + '%');
      });

    }

  },
  /* 内容区滚动效果 */
  setContents: function() {
    var wrapper = $('.km-tab-contents', this.container);
    var wt = this.container.width();
    var contents = this.contents;
    var cFlip = null;
    var self = this;

    if (this.config.contentScroll && wrapper[0]) {
      wrapper.addClass('km-content-scroll');

      //单内容区
      if (contents.length == 1) {
        this.triggers.forEach(function(trigger, index) {
          if (index > 0) {
            contents.after(contents.clone());
          }
        })
        contents = $(this.config.contents, wrapper);
        this.contents = contents;
        this.currentContent = contents[this.currentIndex];
      }

      this._refresh();

    }
  },
  _refresh: function() {
    var wt = this.container.width();
    var wrapper = $('.km-tab-contents', this.container);
    var contents = this.contents;

    $(wrapper).width(wt * contents.length);

    contents.width(wt);
    //contents.css('margin',0);
    //$(contents[contents.length-1]).css('margin-right',-wt);

    this.contentFlip = this.contentFlip || flip(wrapper[0])

    this.contentFlip.refresh();

  },
  on: function(msg, fn) {
    this.eventHandler.on(msg, fn);
  },
  off: function(msg, fn) {
    this.eventHandler.off(msg, fn);
  },
  trigger: function(msg) {
    this.eventHandler.trigger(msg);
  },
  bind: function() {
    var self = this;
    var data = this.config.data;
    var cFlip = this.contentFlip;
    var share = this.config.contentShare;
    var cls = this.config.contents;

    /*触点点击事件*/
    this.triggers.forEach(function(trigger, index) {
      $(trigger).on('click', function() {
        self.moveTo(index);
      })
    })

    /* 内容区滚动事件 */

    cFlip && $(cFlip.element).on('fspointmove', function() {
      self.moveTo(cFlip.currentPoint)
    })

    /*share && cFlip && $(cFlip.element).on('fspointmove',function(){
      var content = self.contents[cFlip.currentPoint];
      var prev = $(content).prev(cls);
      var next = $(content).next(cls);

      if(!prev[0]){
        prev = $(content).clone();
        next.next(cls).remove();
        $(content).before(prev);
      }else if(!next[0]){
        prev.prev(cls).remove();
        next = $(content).clone();
        $(content).after(next);
      }

      self.contents = $(cls,self.container);

      self._refresh();

    })*/

    /*单内容区滚动
    if(this.config.contentScroll && this.config.contentShare){
      this.contents.forEach(function(content,index){
        $(content).on('swipeLeft',function(){
          self.moveTo(self.currentIndex+1 >= self.lens ? 0 : self.currentIndex+1);
        })
        $(content).on('swipeRight',function(){
          self.moveTo(self.currentIndex-1 < 0 ? self.lens-1 : self.currentIndex-1);
        })
      })
    }*/

    /*内容区合并内容切换*/
    if (this.config.contentShare && $.isArray(data)) {
      this.on('beforeMove', function() {
        $(self.currentContent).html((data[self.currentIndex] || {})['content'] || '');
      })
    }

    /*触点定位*/
    this.on('afterMove', function() {

      if (!self.flip) return;

      var index = self.currentIndex;
      if (index === 0) {
        self.flip.moveToPoint(index);
      } else if (index == self.triggers.length - 1) {
        self.flip.moveToPoint(index + 1);
        $(self.triggers[index]).addClass('last');
      } else {
        var posX = 0;
        var pos = self.config.activePos;
        var match = null;
        var curwt = $(self.triggers[index]).width();
        var prewt = $(self.triggers[index - 1]).width();
        var nextwt = $(self.triggers[index + 1]).width();

        for (var i = 0; i < index; i++) {
          posX -= $(self.triggers[i]).width();
        }

        if (match = pos.match(/(\d)x/)) {
          posX = self.singleWidth * (match[1] - index);
        }

        //留出半个前触点
        if (pos == 'left') {
          posX = posX + prewt / 2;
        }

        //留出半个后触点
        if (pos == 'right') {
          posX += (self.container.width() - curwt) - nextwt / 2;
        }

        if (pos == 'center') {
          posX += (self.container.width() / 2 - curwt / 2);
        }

        //限定在0到max区间内
        if (posX > 0) posX = 0;
        if (posX < self.flip._maxX) posX = self.flip._maxX;

        self.flip._setX(posX);
      }

    });

    //执行onSwitch回调
    this.on('afterMove', function() {
      var onswitch = self.config.onSwitch;
      if (typeof onswitch == 'function') {
        onswitch.call(self);
      }
    })

    /*window.onresize = function(){
      self.setWidth();
      self.setContents();
    }*/
  },
  /*Tab切换*/
  moveTo: function(num) {

    if (num === undefined) {
      if (this.config.random === true && this.currentIndex === undefined) {
        num = Math.floor(Math.random() * this.triggers.length);
      } else {
        num = this.currentIndex || 0;
      }
    }

    num = num > this.triggers.length - 1 ? this.triggers.length - 1 : (num < 0 ? 0 : num);

    //避免重复切换
    if (num == this.currentIndex) return;

    //更新标识
    this.lastIndex = this.currentIndex;
    this.currentIndex = num;
    this.currentTrigger = this.triggers[this.currentIndex];
    this.currentContent = this.contents[this.currentIndex] || this.contents[0];

    this.trigger('beforeMove');

    this._move(num);

    this.trigger('afterMove');

    return this;
  },
  _move: function(num) {
    var self = this;
    var share = this.config.contentShare;
    var cFlip = this.contentFlip;

    //已存在index
    if (this.lastIndex !== undefined) {
      share || cFlip || $(this.contents[this.lastIndex]).hide();
      $(this.triggers[this.lastIndex]).removeClass(this.config.activeCls);
      //新的,初始化
    } else {
      share || cFlip || this.contents.forEach(function(content, index) {
        $(content).hide();
      })
      this.triggers.forEach(function(trigger, index) {
        $(trigger).removeClass(self.config.activeCls);
      })
    }

    //显示内容
    share || cFlip || $(this.contents[num]).show();
    cFlip && cFlip.moveToPoint(this.contents.length - 1 < num ? 0 : num);

    //切换触点
    $(this.triggers[num]).addClass(this.config.activeCls);
  }
});

/*
 * 绑定到fn，使组件可链式使用，kimi推荐这样的方式
 * 如果组件和node节点无关，组件可不用绑定fn，支持默认new初始化即可
 */
$.fn.tab = function(config) {
  config = config || {};
  //node节点
  config.el = this;
  return new Tab(config);
};

module.export = Tab;