'use strcit';

var PageBase = require('../../../app/page-base');
var Uri = require('../../../app/uri');
var config = require('../../../app/config');
var util = require('../../../app/util');
require('../../my/common/header');
var tmpl = require('./index.ejs.html');

class Detail extends PageBase {
  constructor() {
    super();
    this.configStatistics();

    var redirectUrl = '../login.html?src=' + encodeURIComponent(location.href);
    this.getToken(redirectUrl).then(() => {
      return this._getItemById();
    }).then(() => {
      // this._bind();
    });
  }

  _bind() {
    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }
  }

  _getItemById() {
    var id = new Uri().getParam('id');

    this.ajax({
      url: '/v1/user/timeline/' + id,
      data: {
        access_token: this.cookie.get('token')
      }
    }).then((data) => {
      // console.log(data);
      data = data.data;
      this._render(data);
    })
  }

  _render(data) {
    if (data.avatar) {
      data.avatar = config.getAvatarPrefix(data.avatar);
    } else {
      data.avatar = getDefaultIconWL();
    }

    if (data.images && data.images instanceof Array) {
      for (var i = 0; i < data.images.length; i++) {
        data.images[i] = config.getAvatarPrefix(data.images[i]);
      }
    }

    var arr = data.title.split(' ');

    // var peopleLen = this.charLen(data.title, '@');
    // var symbosLen = this.charLen(data.title, '#');
    var peopleCount = 0;
    var symbolCount = 0;
    // data.types = 'follow';

    // 识别 title 中的 @ 和 #，并为其加上链接
    arr.forEach((s, index) => {
      if (s.indexOf('#') !== -1) {
        if (s.charAt(0) !== '#') {
          var sy = s.split('#');

          arr[index] = `${sy[0]}<a class="strong" href="../pro-trading.html?symbol=${data.symbols[symbolCount]}&src=${encodeURIComponent(location.href)}">@${sy[1]}</a>`;
        } else {
          arr[index] = `<a class="strong" href="../pro-trading.html?symbol=${data.symbols[symbolCount]}&src=${encodeURIComponent(location.href)}">${s}</a>`;
        }

        symbolCount++;
      } else if (s.indexOf('@') !== -1) {
        if (s.charAt(0) !== '@') {
          var sy = s.split('@');
          arr[index] = `${sy[0]}<a class="strong" href="../my/profile.html?inviteCode=${data.inviteCodes[peopleCount]}&from=${encodeURIComponent(location.href)}">@${sy[1]}</a>`;
        } else {
          arr[index] = `<a class="strong" href="../my/profile.html?inviteCode=${data.inviteCodes[peopleCount]}&from=${encodeURIComponent(location.href)}">${s}</a>`;
        }
        peopleCount++;
      }
    });

    data.title = arr.join(' ');

    var now = Date.now();

    var time = now - util.getTime(data.created);
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

    data.desc = desc;

    console.log(data);

    this.render(tmpl, data, this.listEl);
    // break;
  }



  defaults() {
    return {
      listEl: $('.list')
    }
  }
}

new Detail();