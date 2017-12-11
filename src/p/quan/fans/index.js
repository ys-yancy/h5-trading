'use strcit';

var PageBase = require('../../../app/page-base');
var config = require('../../../app/config');
// var util = require('../../../app/util');
var indexTmpl = require('./index.ejs.html');
// require('../../my/common/header');
// // require('../index/header.css');
require('../../my/common/header');

class Fans extends PageBase {
  constructor() {
    super();
    this.configStatistics();

    var redirectUrl = '../login.html?src=' + encodeURIComponent(location.href);
    this.getToken(redirectUrl).then(() => {
      return this._getFollower();
    });
  }

  _bind() {
    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }
  }

  _getFollower() {
    this.ajax({
      url: 'v1/user/0/follower/',
      data: {
        access_token: this.cookie.get('token')
      }
    }).then((data) => {
      data = data.data;

      data.forEach((item) => {
        if (item.avatar) {
          item.avatar = config.getAvatarPrefix(item.avatar);
        } else {
          item.avatar = getDefaultIconWL();
        }
      });

      this.render(indexTmpl, data, this.listEl);
    })
  }



  defaults() {
    return {
      listEl: $('.list')
    }
  }
}

new Fans();