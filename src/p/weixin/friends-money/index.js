"use strict";

require('../../../lib/zepto');
var PageBase = require('../../../app/page-base');
var Util = require('../../../app/util');
var BottomBanner = require('../../../common/weixin-bottom-banner');
var Nav = require('../../../common/nav');
var Config = require('../../../app/config');
var Sticky = require('../../../common/sticky');
var tmpl = require('./index.ejs');
var Filter = require('./filter/index');

class FriendsRank extends PageBase {
  constructor() {
    super();

    this._initAttrs();
    this._requires();
    this._render();
    this._bind();
    this.configStatistics();

    new Filter({
      el: $('#J_OptionBanner')
    });
  }

  _bind() {
    var doc = $(document);

    doc.on('tap', '.J_Switch', $.proxy(this._switch, this));
    this.subscribe('get:data', this._filter, this);

    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }
  }

  _switch(e) {
    var curEl = $(e.currentTarget),
      type = 'real';

    if (curEl.hasClass('active')) {
      return;
    }

    if (curEl.hasClass('demo')) {
      type = 'demo';
    }

    this.type = type;

    this._setActive(type);
    this._render(type);
  }

  _requires() {
    new BottomBanner({
      page: 'friends'
    });

    new Nav();

    $('header').sticky();
  }

  _initAttrs() {
    this.containerEl = $('#J_List');
    this.url = '/v1/user/transaction/upline_reward/';
  }

  _filter(data) {
    // this._getData(data).then((filterData) => {
    //     console.log(filterData);
    //     var type = this.isDemo() ? 'demo' : 'real';

    //     var list = filterData[type];
    // });
    this._render(this.type, data);
  }

  _getData(filterData) {
    var d = new $.Deferred(),
      time = Date.now() - 24 * 60 * 60 * 1000;

    if (!filterData && this.list) {
      d.resolve(this.list);
    } else {
      var params = {
        access_token: this.cookie.get('token')
      };

      if (filterData) {
        params = $.extend(params, filterData.params);
      }

      this.ajax({
        url: this.url,
        data: params
      }).then(function(data) {
        data = data.data;

        // data = this._sort(data);

        this.list = data;

        d.resolve(this.list);
      }.bind(this));
    }

    return d.promise();
  }

  _render(type, filterData) {

    this._getData(filterData).then(function() {
      var list = this._getList(type);
      var profit = 0,
        num = list.length,
        arr = [];

      list = list.sort(function(val1, val12) {
        var t1 = Util.getTime(val1.created);
        var t2 = Util.getTime(val12.created);
        if (t1 > t2) {
          return -1;
        } else if (t2 > t1) {
          return 1;
        } else {
          return val1.award > val12.award ? -1 : 1;
        }
      });

      $.each(list, function(index, item) {
        profit += parseFloat(item.award);
        if (item.avatar) {
          item.img = Config.getAvatarPrefix(item.avatar);
        } else {
          item.img = getDefaultIconWL();
        }

        if (arr.indexOf(item.nickname) === -1) {
          arr.push(item.nickname);
        }
      });

      $('.J_BottomNum').text(arr.length);
      $('.J_BottomMoney').text(profit.toFixed(2));

      var bottomEl = $('.weixin-bottom-banner');

      if (filterData && filterData.type === 'region') {
        bottomEl.addClass('two');
      } else {
        bottomEl.removeClass('two');
      }

      this.render(tmpl, list, this.containerEl);
      $('#J_Loading').hide();

      if (filterData) {
        $('#J_FilterName').text(filterData.desc);
      }

    }.bind(this));
  }

  /**
   * 用户“实盘”“模拟”都没有佣金时，默认显示“实盘佣金列表”。
   * 用户“实盘”“模拟”都有佣金时，默认显示“实盘佣金列表”。
   * 用户“实盘”有佣金而“模拟”没有佣金时，默认显示“实盘佣金列表”。
   * 用户“实盘”没有佣金而“模拟”有佣金时，默认显示“模拟佣金列表”。
   */
  _getList(type) {
    //  var type = this._getType();

    if (type) {
      return this.list[type];
    } else {
      if (this.list.demo.length > 0 && this.list.real.length === 0) {
        this._setActive('demo');
        this.type = 'demo';
        return this.list.demo;
      }

      this._setActive('real');
      this.type = 'real';

      return this.list.real;
    }
  }

  _sort(data) {
    data.real = data.real.sort(sort);
    data.demo = data.demo.sort(sort);

    return data;

    function sort(a, b) {
      return a.profit > b.profit ? -1 : 1
    }
  }

  _setActive(type) {
    $('.J_Switch').removeClass('active');
    $('.J_Switch.' + type).addClass('active');
  }
}

new FriendsRank();