'use strict';

var PageBase = require('../../../app/page-base');
var Util = require('../../../app/util');
var InfinityScroll = require('../../../common/infinite-scroll/index');
var tmpl = require('./index.ejs');
require('../common/header');
var Header = require('../../../common/header');
var Sticky = require('../../../common/sticky');
var Config = require('../../../app/config');

class BestMonth extends PageBase {
  constructor() {
    super();
    this.configStatistics();
    this._initScroll();

    $('#J_Month').text(new Date().getMonth() + 1);
    new Header();
    $('nav').sticky();
    
    this._checkHeader();

    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }

    // if (getWXWL() == 'ifbao') {
    //   $('.list').on('click', 'a', function() {
    //     return false;
    //   })
    // }
  }

  _checkHeader() {
    var s = window.location.search;
    if (s) {
      $.each($('.sort'), function( index, value ) {
        value.href += s;
      });
    }
  }

  _initScroll() {
    var count = 10;
    var self = this;

    new InfinityScroll({
      loadingConfig: {
        el: $('#J_Loading'),
        needInit: false,
      },
      params: {
        page: 1,
        page_size: 10,
        wl: Cookie.get('wl')
      },
      el: $('#J_List'),
      url: '/v1/rank/order/latest',
      tmpl: tmpl,
      // emptyTmpl: this.emptyTmpl,
      infinite: true,
      beforeRequest: function(params) {
        return {
          page_size: count,
          page: params.page
        };
      },
      parse: function(data, params) {
        if (data && data.data) {
          var hasNextPage = true;

          if (data.data.length === 0 || data.data.length < count) {
            hasNextPage = false;
          }

          self._parse(data.data);

          // $.each(data.data, function(index, item) {
          //   var symbol = item.symbol;

          //   item.kw = q;

          //   item.add = optionList.indexOf(symbol) !== -1 ? false : true;
          // });


          return {
            data: data.data,
            hasNextPage: hasNextPage
          }
        }

        return data;
      },

      callback: function() {

      }
    });
  }

  _parse(data) {
    var now = Date.now();

    data.forEach((item) => {
      var time = now - Util.getTime(item.openTime);
      var desc;

      if (time < 10 * 60 * 1000) {
        desc = '刚刚';
      } else if (time < 60 * 60 * 1000) {
        desc = parseInt(time / (60 * 1000)) + '分钟';
      } else if (time < 24 * 60 * 60 * 1000) {
        desc = parseInt(time / (60 * 60 * 1000)) + '小时';
      } else if (time < 30 * 24 * 60 * 60 * 1000) {
        desc = parseInt(time / (24 * 60 * 60 * 1000)) + '天';
      } else if (time < 30 * 24 * 60 * 60 * 1000 * 24) {
        desc = parseInt(time / (24 * 60 * 60 * 1000 * 30)) + '月';
      } else {
        desc = parseInt(time / (24 * 60 * 60 * 1000 * 30 * 12)) + '年';
      }

      item.desc = desc;
    });
  }

  _getData() {
    this.ajax({
      url: '/v1/rank/order/latest',
      data: {
        equity_threshold: Config.getRankEquityThreshold(),
        page: 1,
        page_size: 10

      }
    }).then((data) => {
      data = data.data;

      var now = Date.now();

      data.forEach((item) => {
        var time = now - Util.getTime(item.openTime);
        var desc;

        if (time < 10 * 60 * 1000) {
          desc = '刚刚';
        } else if (time < 60 * 60 * 1000) {
          desc = parseInt(time / (60 * 1000)) + '分钟';
        } else if (time < 24 * 60 * 60 * 1000) {
          desc = parseInt(time / (60 * 60 * 1000)) + '小时';
        } else if (time < 30 * 24 * 60 * 60 * 1000) {
          desc = parseInt(time / (24 * 60 * 60 * 1000)) + '天';
        } else if (time < 30 * 24 * 60 * 60 * 1000 * 24) {
          desc = parseInt(time / (24 * 60 * 60 * 1000 * 30)) + '月';
        } else {
          desc = parseInt(time / (24 * 60 * 60 * 1000 * 30 * 12)) + '年';
        }

        item.desc = desc;
      });

      // data.forEach((item) => {
      //   item.avatar = item.avatar ? Config.getAvatarPrefix(item.avatar) : getDefaultIconWL();
      // });

      this.render(tmpl, data, $('.list'));
      console.log(data);


      // 添加微信分享


    });
  }
}

new BestMonth();