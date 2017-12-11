'use strcit';

var PageBase = require('../../../app/page-base');
var bannerTmpl = require('./banner.ejs.html');
require('../../../common/slider/index');
var config = require('../../../app/config');
var util = require('../../../app/util');
// var indexTmpl = require('./index.ejs.html');
// require('../../my/common/header');
// // require('../index/header.css');

class Discovery extends PageBase {
  constructor() {
    super();
    this.configStatistics();

    var redirectUrl = '../login.html?src=' + encodeURIComponent(location.href);
    this.getToken(redirectUrl).then(() => {
      this._getBanner();
      this._getFriends();
      this._initAttr();
    });
  }

  _bind() {
    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }
  }

  _getBanner() {
    this.ajax({
      url: '/v1/user/banner',
      data: {
        wl: getWXWL()
      }
    }).then((data) => {
      data = data.data;

      if (data.length != 0) {

        data.sort((v1, v2) => {
          return v1.order - v2.order;
        });

        data.forEach((item) => {
          if (item.image && item.image.indexOf('http') == -1) {
            item.image = item.image.slice(item.image.indexOf('/static/banner'));
            item.image = config.getAvatarPrefix(item.image);
          }
          if (item.link && item.link.indexOf('http') == -1) {
            item.link = 'http://' + item.link;
          }
        });

        console.log(data);


        this.render(bannerTmpl, data, $('.km-slider-outer'));
        if (data.length > 1) {
          $('#slider').slider({
            loop: true,
            play: true,
            interval: 5 * 1000,
            duration: 1000
          });
        }
      }
      else {
        $('.img')[0].src = getBannerImgUrl();
      }
    })
  }

  _getFriends() {
    this.ajax({
      url: '/v1/user/transaction/upline_reward/',
      data: {
        access_token: this.cookie.get('token'),
        date: util.formateDate(Date.now(), 'YYYY-MM-DD'),
        // date: '2016-05-10',
        period: 1
      }
    }).then((data) => {
      data = data.data;

      var count = 0;
      if (data.real.length > 0) {
        data.real.forEach((item) => {
          count += parseFloat(item.award);
        });

        $('.J_Count').text((count).toFixed(2) || 0);
        $('.J_CountWrapper').show();
      }
    });
  }

  _initAttr() {
    this._wrapperUrl($('#J_Friends'));
    this._wrapperUrl($('#J_SortMonth'));
    this._wrapperUrl($('#J_SortLatest'));
    this._wrapperUrl($('#J_SortProfit'));
    this._wrapperUrl($('#J_Modify_Profile'));
  }

  _wrapperUrl(el) {
    var href = $(el).attr('href');

    $(el).attr('href', href + '?from=' + encodeURIComponent(location.href));
  }
}

new Discovery();