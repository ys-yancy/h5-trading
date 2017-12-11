'use strcit';

var PageBase = require('../../../app/page-base');
require('../../my/common/header');
var infoTmpl = require('./info.ejs.html');
var indexTmpl = require('./index.ejs.html');
var config = require('../../../app/config');
var util = require('../../../app/util');
require('../../../common/sticky');

class Mine extends PageBase {
  constructor() {
    super();
    this.configStatistics();

    var redirectUrl = '../login.html?src=' + encodeURIComponent(location.href);


    this.getToken(redirectUrl).then(() => {

      this._getInfo().then((data) => {
        this._renderInfo(data);
      });
      this._getTimeline().then((data) => {
        this.length = data.length;
        this._render(data);
      });

      // this.core = new Core({
      //   inviteCode: 
      // })
      $('#J_Header').sticky();
      this._bind();
    });
  }

  _bind() {
    var doc = $(document);

    doc.on('tap', '.J_Refresh', (e) => {
      this.loaderEl.show();
      var top = this.listEl.offset().top;
      $(window).scrollTop(0);

      this._getTimeline().then((data) => {
        var len = data.length;

        if (data.length === len) {
          this.loaderEl.hide();
          return;
        } else {
          var newData = data.slice(0, len - this.length);
          this._render(newData, true);

          this.length = len;
        }
      });
    })
    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }

  }

  _renderInfo(data) {
    if (data.avatar) {
      data.avatar = config.getAvatarPrefix(data.avatar);
    } else {
      data.avatar = getDefaultIconWL();
    }

    this.render(infoTmpl, data, $('#J_Info'));

  }

  _getTimeline() {
    return this.ajax({
      url: '/v1/user/timeline/',
      data: {
        access_token: this.cookie.get('token')
      }
    }).then((data) => {
      // console.log(data);
      data = data.data;

      return data;
    });
  }

  _render(data, fresh) {
    this._parse(data);

    this.loaderEl.hide();

    if (fresh) {
      this.render(indexTmpl, data, this.listEl);
    } else {
      // this.renderTo(indexTmpl, data, this.listEl);
      var html = this.render(indexTmpl, data);

      this.listEl.prepend(html);
    }

    this._getRate();
  }

  _parse(data) {

    var now = Date.now();

    data.forEach((item) => {
      if (item.avatar) {
        item.avatar = config.getAvatarPrefix(item.avatar);
      } else {
        item.avatar = getDefaultIconWL();
      }

      if (item.images && item.images instanceof Array) {
        for (var i = 0; i < item.images.length; i++) {
          item.images[i] = config.getAvatarPrefix(item.images[i]);
        }
      }


      switch (item.type) {
        case 'open':
          item.typeName = '建仓';
          item.types = 'order';
          item.typeStatus = '未平仓';
          break;
        case 'pending_open':
          item.typeName = '挂单';
          item.types = 'order';
          item.typeStatus = '未平仓';
          break;
        case 'modify':
          item.typeName = '订单修改';
          item.types = 'order';
          item.typeStatus = '未平仓';
          break;
        case 'close':
          item.typeName = '订单平仓';
          item.types = 'order';
          item.typeStatus = '已平仓';
          break;
        case 'delete':
          item.typeName = '删除挂单';
          item.types = 'order';
          item.typeStatus = '已平仓';
          break;
        case 'takeprofit':
          item.typeName = '止盈平仓';
          item.types = 'order';
          item.typeStatus = '已平仓';
          break;
        case 'stoploss':
          item.typeName = '止损平仓';
          item.types = 'order';
          item.typeStatus = '已平仓';
        case 'margin_check':
          item.typeName = '强制平仓'; // + loose;
          item.typeStatus = '已平仓';
          item.types = 'order';
          break;
        case 'follow':
          item.typeName = `<a class="strong" href="../my/profile.html?inviteCode=${item.followerInviteCode}&from=${encodeURIComponent(location.href)}">@${item.followerNickName}</a> 关注了您`;
          item.types = 'follow';
          break;
        case 'followed':
          item.typeName = `您关注了 <a class="strong" href="../my/profile.html?inviteCode=${item.followedInviteCode}&from=${encodeURIComponent(location.href)}">@${item.followedNickName}</a>`;

          item.types = 'follow';
          break;
        case 'user_publish':
          var arr = item.title.split(' ');

          // var peopleLen = this.charLen(item.title, '@');
          // var symbosLen = this.charLen(item.title, '#');
          var peopleCount = 0;
          var symbolCount = 0;
          // item.types = 'follow';

          // 识别 title 中的 @ 和 #，并为其加上链接
          arr.forEach((s, index) => {
            if (s.indexOf('#') !== -1) {
              if (s.charAt(0) !== '#') {
                var sy = s.split('#');

                arr[index] = `${sy[0]}<a class="strong" href="../pro-trading.html?symbol=${item.symbols[symbolCount]}&src=${encodeURIComponent(location.href)}">@${sy[1]}</a>`;
              } else {
                arr[index] = `<a class="strong" href="../pro-trading.html?symbol=${item.symbols[symbolCount]}&src=${encodeURIComponent(location.href)}">${s}</a>`;
              }

              symbolCount++;
            } else if (s.indexOf('@') !== -1) {
              if (s.charAt(0) !== '@') {
                var sy = s.split('@');
                arr[index] = `${sy[0]}<a class="strong" href="../my/profile.html?inviteCode=${item.inviteCodes[peopleCount]}&from=${encodeURIComponent(location.href)}">@${sy[1]}</a>`;
              } else {
                arr[index] = `<a class="strong" href="../my/profile.html?inviteCode=${item.inviteCodes[peopleCount]}&from=${encodeURIComponent(location.href)}">${s}</a>`;
              }
              peopleCount++;
            }
          });

          item.title = arr.join(' ');
          break;

        default:
          item.hide = true;
      }


      // data.forEach((item) => {
      var time = now - util.getTime(item.created);
      var desc;

      if (time < 10 * 60 * 1000) {
        desc = '刚刚';
      } else if (time < 60 * 60 * 1000) {
        desc = parseInt(time / (60 * 1000)) + '分钟前';
      } else if (time < 24 * 60 * 60 * 1000) {
        desc = parseInt(time / (60 * 60 * 1000)) + '小时前';
      } else if (time < 30 * 24 * 60 * 60 * 1000) {
        desc = parseInt(time / (24 * 60 * 60 * 1000)) + '天前';
      } else if (time < 30 * 24 * 60 * 60 * 1000 * 24) {
        desc = parseInt(time / (24 * 60 * 60 * 1000 * 30)) + '月前';
      } else {
        desc = parseInt(time / (24 * 60 * 60 * 1000 * 30 * 12)) + '年前';
      }

      item.desc = desc;
      // });
      if (item.types && item.types !== 'follow') {
        item.profits = parseFloat(item.profit) + parseFloat(item.swap) - parseFloat(item.commission);
      }
    });
  }

  _getRate() {
    var rateEls = $('.J_Rate', this.listEl);
    var codes = [];

    rateEls.each((index, item) => {
      var itemEl = $(item);
      var code = itemEl.attr('data-code');

      if (codes.indexOf(code) === -1) {
        codes.push(code);
      }
    });

    codes.forEach((code) => {

      this._getInfo(code).then((data) => {
        if (!data.month_rate_of_return) {
          var rate = NaN;
        } else {
          var rate = (data.month_rate_of_return * 100).toFixed(2);
        }

        console.log(rate, data.month_rate_of_return);
        if (isNaN(rate) || !rate) {
          $('.J_Rate[data-code=' + code + ']').text('不可查看').parent().addClass('disable');
        } else {
          $('.J_Rate[data-code=' + code + ']').text(rate);
        }


      });
    });
  }

  charLen(str, chars) {
    var count = 0;
    for (var i = 0, len = str.length; i < len; i++) {
      if (str[i] === chars) {
        count++;
      }
    }

    return count;
  }

  _getInfo(inviteCode) {
    return this.ajax({
      url: '/v1/user/profile/info',
      data: {
        invite_code: inviteCode,
        access_token: this.cookie.get('token') || ''
      }
    }).then((data) => {
      return data.data;
    });
  }

  _setUrl() {
    this._wrapperUrl($('#J_Modify_Profile'));
  }

  _wrapperUrl(el) {
    var href = $(el).attr('href');

    $(el).attr('href', href + '?from=' + encodeURIComponent(location.href));
  }



  defaults() {
    return {
      listEl: $('#J_List'),
      loaderEl: $('#J_Loading')
    }
  }
}

new Mine();