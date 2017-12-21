"use strict";

// require('./index.css');
var PageBase = require('../../../app/page-base');
var Util = require('../../../app/util');
// var tmpl = require('./index.ejs');


export default class OptionBanner extends PageBase {
  constructor(config) {
    super(config);

    this._bind();
  }

  _bind() {
    var doc = $(document);

    $('.J_Filter').on('click', $.proxy(this._fold, this));

    $('.J_FilterTime').on('blur', $.proxy(this._blur, this));

    this.el.on('click', '.J_Submit', $.proxy(this._submit, this));
    this.el.on('click', '.J_FilterAction', $.proxy(this._quickFilter, this));
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
      this._fold();
      return;
    }

    console.log(Util.getTime(end, 'YYYY-MM-DD'))

    var params = {
      date_field: 'update_at',
      date_start: start,
      date_end: Util.formateTime(Util.getTime(end, 'YYYY-MM-DD'), 'yyyy-MM-dd') //+ 24 * 1000 * 60 * 60
    }

    $('.filters').attr({
      'data-desc': start + '至' + end,
      'data-startTime': params.date_start,
      'data-endTime': params.date_end
    }).removeAttr('data-kind');
    $('#J_List').attr('data-empty',true)
    $('#J_List').html('');
    this.broadcast('get:data', {
      params: params,
      desc: start + '至' + end,
      type: 'all',
      region: true
    });
    this._fold();
  }

  _quickFilter(e) {
    $('#J_List').html('');
    var curEl = $(e.currentTarget);
    var index = curEl.index();
    var params = {};
    if (curEl.hasClass('active')) {
      return;
    }

    var desc;
    var type;

    switch (index) {
      case 0:
        desc = '全部';
        break;
      case 1:
        desc = '今天';
        var time = Date.now();

        var params = {
          date_field: 'update_at',
          date_start: Util.formateTime(time, 'yyyy-MM-dd'),
          date_end: Util.formateTime(time, 'yyyy-MM-dd')
        }

        type = 'today'
        break;
      case 2:
        var time = Date.now() - 24 * 60 * 60 * 1000;

        var params = {
          date_field: 'update_at',
          date_start: Util.formateTime(time, 'yyyy-MM-dd'),
          date_end: Util.formateTime(Date.now(), 'yyyy-MM-dd')
        }

        desc = '当月数据';
        type = 'month';
        break;
      case 3:
        type = 7;
        desc = '最近7天';
        break;
    }

    $('.filters').removeAttr('data-startTime data-endTime','')
    .attr({
      'data-kind': type,
      'data-desc': desc
    });
    $('#J_List').attr('data-empty',true)
    console.log(this)
    curEl.siblings().removeClass('active');
    curEl.addClass('active');
    this.broadcast('get:data', {
      params: params,
      desc: desc,
      type: type
    });
    this._fold();
  }

  _fold(e) {
    var hdContentEl = $('#J_Header');

    if (hdContentEl.hasClass('move-x')) {
      hdContentEl.removeClass('move-x');
      return;
    }

    hdContentEl.addClass('move-x');
  }

  _showError(curEl, message) {
    var parent = curEl.parents();
    var messageEl = curEl.siblings('.err');

    if (messageEl.length === 0) {
      curEl.after('<p class="err">' + message + '</p>');
    } else {
      messageEl.text(message);
      // messageEl.show();
    }
    parent.addClass('error');
  }

  _hideError(curEl) {
    var parent = curEl.parents();
    var messageEl = curEl.siblings('.err');

    parent.removeClass('error');
    messageEl.hide();
  }

  reset() {
    $('.J_FilterAction').removeClass('active');
    $($('.J_FilterAction')[0]).addClass('active');
    $('.J_FilterTime').val('');
  }

  _preventTouch(e) {
    e.preventDefault();
  }
}