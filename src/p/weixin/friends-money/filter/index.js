"use strict";

// require('./index.css');
var PageBase = require('../../../../app/page-base');
var Util = require('../../../../app/util');
// var tmpl = require('./index.ejs');


export default class OptionBanner extends PageBase {
  constructor(config) {
    super(config);


    this._setHeight();
    this._bind();


    // $('.J_FilterTime').val(Util.formateTime(Date.now(), 'yyyy-MM-dd'));
  }

  _bind() {
    var doc = $(document);

    $('.J_Filter').on('click', $.proxy(this._fold, this));
    $('.J_OptionBannerMask').on('click', $.proxy(this._fold, this));

    this.el.on('click', '.J_FilterAction', $.proxy(this._quickFilter, this));


    // document.body.addEventListener('touchstart', function() {}, true);
    $('.J_OptionBannerMask').on('touchmove', $.proxy(this._preventTouch, this));
    $('#J_OptionBanner').on('touchmove', $.proxy(this._preventTouch, this));
    $('.J_FilterTime').on('blur', $.proxy(this._blur, this));

    this.el.on('click', '.J_Submit', $.proxy(this._submit, this));
  }

  _blur(e) {
    var curEl = $(e.currentTarget);
    this._validate(curEl);
  }

  _validate(curEl) {
    var val = curEl.val();

    if (!val) {
      this._showError(curEl, '时间不能为空');
      return false;
    }


    if (!/\d{4}\-\d{1,2}\-\d{1,2}/.test(val)) {
      this._showError(curEl, '请输入正确的日期');
      return false;
    } else {
      this._hideError(curEl);
      return true;
    }

    if (Util.getTime(val, 'YYYY-MM-DD') > Date.now()) {
      this._showError(curEl, '时间不能大于现在');
      return false;
    }

    if (curEl.hasClass('.time-second')) {
      var firstVal = $('.time-first').val();

      if (Util.getTime(firstVal, 'YYYY-MM-DD') > Util.getTime(val, 'YYYY-MM-DD')) {
        this._showError(curEl, '截至时间不能大于开始时间');
        return false;
      }

    }
  }

  _submit(e) {
    var pass = true;
    var start, end;
    $('.J_FilterTime').each((index, item) => {
      item = $(item);

      if (!this._validate(item)) {
        pass = false;
      }

      if (index == 0) {
        start = item.val();
      } else {
        end = item.val();
      }
    });

    if (!pass) {
      return;
    }

    var params = {
      date: start,
      period: parseInt((Util.getTime(end, 'YYYY-MM-DD') - Util.getTime(start, 'YYYY-MM-DD')) / (1000 * 24 * 60 * 60))
    }


    this.broadcast('get:data', {
      params: params,
      desc: start + ' 至 ' + end,
      type: 'region'
    });
    this._fold();


  }

  _quickFilter(e) {
    var curEl = $(e.currentTarget);
    var index = curEl.index();
    var params = {};

    if (curEl.hasClass('active')) {
      return;
    }

    var desc;

    switch (index) {
      case 0:
        desc = '今天';
        break;
      case 1:
        var time = Date.now() - 24 * 60 * 60 * 1000;
        params.date = Util.formateTime(time, 'yyyy-MM-dd');
        desc = '昨天';
        break;
      case 2:
        var time = Date.now() - 7 * 24 * 60 * 60 * 1000;
        params.date = Util.formateTime(time, 'yyyy-MM-dd');
        params.period = 7;
        desc = '最近7天';
        break;
      case 3:
        var time = Date.now() - 30 * 24 * 60 * 60 * 1000;
        params.date = Util.formateTime(time, 'yyyy-MM-dd');
        params.period = 30;
        desc = '最近30天';
        break;
    }

    curEl.siblings().removeClass('active');
    curEl.addClass('active');

    this.broadcast('get:data', {
      params: params,
      desc: desc
    });
    this._fold();
  }



  _setHeight() {
    var height = $(window).height();

    this.el.height(height);
  }

  _fold(e) {
    var bodyEl = $('#J_Page'),
      htmlEl = $('html');

    if (bodyEl.hasClass('move-x')) {
      //htmlEl.removeClass('move-x');
      $('body').removeClass('unfold');

      setTimeout(() => {
        this.el.hide();
      }, 300);

      this.el.css({
        top: 0
      });
      $('.J_OptionBannerMask').css({
        top: 0
      })
      bodyEl.removeClass('move-x');

      $('.J_OptionBannerMask').hide();
      bodyEl.css({
        height: 'auto',
        // overflow: 'auto'
      });

      this.broadcast('reset:bottom');

    } else {
      this.el.show();
      $('body').addClass('unfold');
      var scrollTop = $(window).scrollTop();
      this.el.css({
        top: scrollTop
      });
      $('.J_OptionBannerMask').css({
          top: scrollTop
        })
        //htmlEl.addClass('move-x');

      // setTimeout(() => {
      bodyEl.addClass('move-x');

      bodyEl.css({
        height: $(window).height(),
        //  'overflow': 'hidden'
      });
      $('.J_OptionBannerMask').show();
      //}, 150);

      $('.weixin-bottom-banner').hide();
    }

  }

  _showError(curEl, message) {
    var parent = curEl.parents();
    var messageEl = curEl.siblings('.err');

    if (messageEl.length === 0) {
      curEl.after('<p class="err">' + message + '</p>');
    } else {
      messageEl.text(message);
      messageEl.show();
    }
    parent.addClass('error');
  }

  _hideError(curEl) {
    var parent = curEl.parents();
    var messageEl = curEl.siblings('.err');

    parent.removeClass('error');
    messageEl.hide();
  }

  _preventTouch(e) {
    e.preventDefault();
  }
}