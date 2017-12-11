"use strict";

require('./index.css');

var PageBase = require('../../app/page-base');
var Slide = require('../../common/slide/h');
var tmpl = require('./index.ejs');
var singleTmpl = require('./single.ejs');

export default class TopSwtich extends PageBase {
  constructor(config) {
    super(config);

    // this.render(tmpl, {}, this.el);
    // this.count = 0;

    if (this.css) {
      this.el.css(this.css);
    }
    if (this.className) {
      this.el.addClass(this.className)
    }

    // this._geUserFollower().then((data) => {
    //   if (data.length >= 5) {
    //     this.showFollower = true;
    //   }
    // }).then(() => {
    //   this._getData();
    // });

    this.showFollower = false;

    this._getData();
  }

  _lazyBind() {
    var doc = $(document);

    $('.msg-close').on('click', (e) => {
      clearTimeout(this.timer);
      this._empty();
    });

    // $('#J_TopMsg').on('touchstart', (e) => {
    //   // console.log(this.slider);
    //   this.slider && this.slider.pause();
    // }).on('touchend', (e) => {
    //   this.slider && this.slider.resume();

    // })
  }

  _getData() {
    this.ajax({
      url: '/v1/marquee/',
      data: {
        tags: this.tags + ',' + getWXWL(),
        start: 0,
        end: 10
      }
    }).then((data) => {
      //var data = { "status": 200, "lang": "zh-CN", "message": "OK", "data": [{ "repeat": 2, "end": "2017-05-13 10:16:15", "tags": "order,tzyh365,invhero,hdtc,xinwaihui,null,None", "url": "", "interval": 60, "order": 0, "content": "\u5c0f\u63d0\u793a\uff1a\u5206\u4eab\u5b9e\u76d8\u8ba2\u5355\u5230\u670b\u53cb\u5708\uff0c\u62bd\u5b9e\u76d8\u8d44\u91d1\u6700\u9ad8100\u7f8e\u5143", "start": "2016-05-13 10:16:13", "duration": 15, "id": 9 }, { "repeat": 1, "end": "2017-05-12 17:33:09", "tags": "option,order,tzyh365,invhero,hdtc,xinwaihui,null,None", "url": "", "interval": 60, "order": 0, "content": "\u5173\u6ce8\u5fae\u4fe1\u8ba2\u9605\u53f7TZYH168\uff0c\u6bcf\u65e5\u89e3\u76d8+\u5b9e\u76d8\u7ea2\u5305\u798f\u5229", "start": "2016-05-12 17:33:08", "duration": 15, "id": 8 }] }
      this.onRequest = false;

      if (data.data.length == 0) {
        return;
      }

      var messages = [];
      var showdata;



      // 2.content的首字符是“★”时，若用户邀请人数大于等于5人，则展示此条广播信息
      data.data.forEach((item) => {
        if (item.content.indexOf('★') === -1) {
          messages.push(item);
        }
      });

      if (!this.showFollower) {
        showdata = messages;
      } else {
        showdata = data.data;
      }

      if (this.slider) {
        // this._add([{
        //   content: "haha" + this.count++,
        //   duration: 0,
        //   end: "2015-12-26 13:36:08",
        //   id: 13,
        //   interval: 60,
        //   order: 8,
        //   repeat: 3,
        //   start: "2015-12-22 13:36:07",
        //   tags: "option,order",
        //   url: "",
        // }]);
        this._add(showdata);

        if (this.slider.paused) {
          // setTimeout(() => {
          //   this._getData();
          // }, this.interval);
        }

        return;
      }

      this._empty();

      if (showdata.length !== 0) {
        var sortData = showdata.sort((v1, v2) => {
          v1.order > v2.order ? -1 : 1;
        });

        this.queue = sortData;
        this.queue.forEach((item) => {
          this.contents.push(item.content);
        });

        // var max = this._getMax(data.data);
        // max.speed = this.speed / 2 * parseFloat($('html').attr('data-dpr'));
        this.renderTo(tmpl, sortData, this.el);

        this.el.addClass('show');
        this._lazyBind();
        this.slider = new Slide({
          el: $('#J_TopMsg'),
          duration: 1, //this.duration,
          interval: this.slideInterval
        });

        this.slider.on('empty', (e) => {
          if (e.empty) {
            this.hide();
          } else {
            this.show();
          }
        });
        this.slider.on('before', (e) => {
          // 完成
          if (!e.curEl) {
            return;
          }
          e.itemEls.each((index, item) => {
            item = $(item);
            if ($('marquee', item).length !== 0) {
              item.html($('marquee', item).html());
            }
          });


          if ($('marquee', e.curEl).length == 0) {
            // window.a = function(){console.log(1)}
            $('span', e.curEl).wrap('<marquee>');

            $('marquee', e.curEl).on('finish', function(e) {
              console.log(e);
            })
          }
        });

        this.slider.fireBefore(true);

        this.slider.on('complete', () => {
          this.queue.forEach((item) => {
            item.repeat--;
            if (item.repeat === 0) {
              var index = this.contents.indexOf(item.content);
              this.contents.splice(index, 1);
              this.slider.remove(index);
            }
          });
          setTimeout(() => {



            if (this.onRequest) {
              return;
            }

            this.onRequest = true;

            // setTimeout(() => {
            //   this._getData();
            // }, this.interval);
          }, this.duration);
        });
      }

      // this.timer = setTimeout(() => {
      //     this._getData();
      // }, this.interval);
    });
  }

  _geUserFollower() {
    return this.ajax({
      url: '/v1/user/0/follower',
      data: {
        access_token: this.cookie.get('token')
      }
    }).then((data) => {
      return data.data;
    });
  }

  _empty() {
    $('#J_TopMsg').remove();
    this.el.removeClass('show');
    this.slider && this.slider.destory();
  }

  show() {
    $('#J_TopMsg').show();
    $('#J_TopMsg').parent('.top-message').addClass('show');
  }

  hide() {
    $('#J_TopMsg').hide();
    $('#J_TopMsg').parent('.top-message').removeClass('show');
  }

  _add(data) {
    data.forEach((item) => {
      if (this.contents.indexOf(item.content) === -1 && !this._inQueue(item.content)) {
        this.contents.push(item.content);
        this.queue.push(item);

        this.contents = this.contents.sort((v1, v2) => {
          v1.order > v2.order ? -1 : 1;
        });
        var index = this.contents.indexOf(item.content);
        var html = this.render(singleTmpl, item);
        this.slider.add($(html), index);
      }
    });
  }

  _inQueue(content) {
    var find = false;

    this.queue.forEach((item) => {
      if (item.content === content) {
        find = true;
      }
    });

    return find;
  }

  // _getMax(data) {
  //     var max = data[0];

  //     for (var i = 1; i < data.length; i++) {
  //         if (data[i].order > max.order) {
  //             max = data[i];
  //         }
  //     }

  //     return max;
  // }

  add(tag) {
    var tags = this.tags === '' ? [] : this.tags.split(',');


    if (tags.indexOf(tag) === -1) {
      tags.push(tag)
      this.tags = tags.join(',');
    }
  }

  remove(tag) {
    var tags = this.tags === '' ? [] : this.tags.split(',');
    var index = tags.indexOf(tag);
    if (index !== -1) {
      tags.splice(index, 1);

      this.tags = tags.join(',');
    }
  }

  defaults() {
    return {
      el: $('#J_Header'),
      interval: 6000,
      tags: '',
      duration: 500,
      slideInterval: 12000,
      contents: [],
      queue: []
    }
  }

}