'use strcit';

var PageBase = require('../../../app/page-base');
var numeral = require('../../../lib/numeral');
var config = require('../../../app/config');
var util = require('../../../app/util');
var hdTmpl = require('./head.ejs.html');
var listTmpl = require('./list.ejs.html');
var rankTmpl = require('./rank.ejs.html');
require('../../my/common/header');
// require('./header.css');

class Friends extends PageBase {
  constructor() {
    super();
    this.configStatistics();

    this.getToken().then(() => {
      this.getData();

      this._bind();

      $('.friends').attr('href', './invite.html?from=' + encodeURIComponent(location.href));
      $('.add').attr('href', '../share.html?from=' + encodeURIComponent(location.href));

    });
  }

  _bind() {
    var doc = $(document);

    doc.on('tap', '.J_Detail', $.proxy(this._showDetail, this));
    doc.on('tap', '.J_Mask', $.proxy(this._hideDetail, this));
    doc.on('tap', '.bg', $.proxy(this._hideDetail, this));

    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }
  }

  _showDetail() {
    $('.pop-wrapper').show();
  }

  _hideDetail() {
    $('.pop-wrapper').hide();
  }



  getData() {
    return this.ajax({
      url: '/v1/user/transaction/upline_reward/',
      data: {
        access_token: this.cookie.get('token'),
        date: util.formateDate(Date.now(), 'YYYY-MM-DD'),
        // date: '2016-05-10',
        period: 1
      }
    }).then((data) => {

      data = data.data && data.data;
      var count = 0;
      var num = 0;
      var names = [];

      if (data) {
        var total = numeral(data.real_award).format('0,0.00');
        if (data.real.length > 0) {
          data.real.forEach((item) => {
            if (names.indexOf(item.nickname) === -1) {
              names.push(item.nickname);
            }
            if (item.avatar) {
              item.avatar = config.getAvatarPrefix(item.avatar);
            } else {
              item.avatar = getDefaultIconWL();
            }
            count += parseFloat(item.award);
            item.award = numeral(item.award).format('0,0.00');
            item.levelName = item.level == 1 ? '一' : item.level == 2 ? '二' : item.level == 3 ? '三' : '未知';
          });

          this.render(hdTmpl, { count: numeral(count).format('0,0.00'), num: names.length, total: total }, this.headEl);
          this.render(listTmpl, data.real, this.listEl);
        } else {
          this.render(hdTmpl, { count: 0, num: 0, total: total }, this.headEl);
          this._getRank().then(() => {
            this._setHeight();
          });
        }

        $('#J_Loading').hide();

        this._setHeight();
        $('.total').attr('href', './journey.html?from=' + encodeURIComponent(location.href));
      }

    });
  }

  _setHeight() {

    var h = $('h1', this.listEl).height();
    var p = $('.wrapper', this.listEl).height();
    $('.J_Inner', this.listEl).height($(window).height() - $('#J_Header').height() - this.headEl.height() - h - p);
  }

  _getRank() {
    return this.ajax({
      url: '/v1/rank/upline_reward/whitelabel/',
      data: {
        access_token: this.cookie.get('token'),
        start: 0,
        end: 20,
        wl: getWXWL(),
      }

    }).then((data) => {
      data = data.data;

      data.list.forEach((item) => {
        if (item.avatar) {
          item.avatar = config.getAvatarPrefix(item.avatar);
        } else {
          item.avatar = getDefaultIconWL();
        }
      });

      this.render(rankTmpl, data.list, this.listEl);
    });
  }

  defaults() {
    return {
      headEl: $('#J_HD'),
      listEl: $('#J_List')
    }
  }
}

new Friends();
