'use strcit';

var PageBase = require('../../../app/page-base');
var config = require('../../../app/config');
var util = require('../../../app/util');
var numeral = require('../../../lib/numeral');
var listTmpl = require('./list.ejs.html');
require('../../my/common/header');
var Filter = require('../../weixin/friends-money/filter');
require('./filter.css');
// require('../index/header.css');


class Friends extends PageBase {
  constructor() {
    super();
    this.configStatistics();

    this.getToken().then(() => {
      this.getData();

      this._bind();

      $('.list').css('min-height', $(window).height() - $('#J_Header').height());

      new Filter({ el: $('#J_OptionBanner') })
    });
  }

  _bind() {
    this.subscribe('get:data', this._filter, this);

    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }
  }

  _filter(option) {
    this.getData(option.params);
    $('.footer').show();

    $('.J_Desc').text(option.desc);
  }


  getData(option) {
    option = option || {};
    return this.ajax({
      url: '/v1/user/transaction/upline_reward/',
      data: {
        access_token: this.cookie.get('token'),
        date: option.date || util.formateDate(Date.now() - 1000 * 24 * 60 * 60 * 1000, 'YYYY-MM-DD'),
        // date: '2016-05-10',
        period: option.period || 1000
      }
    }).then((data) => {

      data = data.data;
      var count = 0;
      var num = 0;
      var names = [];

      if (data && data.real && data.real.length > 0) {
        // console.log(data);

        var cate = {};
        var total = numeral(data.real_award).format('0,0.00');
        if (data.real.length > 0) {
          data.real.forEach((item) => {
            if (names.indexOf(item.nickname) === -1) {
              names.push(item.nickname);
            }
            var time = item.created.split(' ')[0];

            if (item.avatar) {
              item.avatar = config.getAvatarPrefix(item.avatar);
            } else {
              item.avatar = getDefaultIconWL();
            }
            count += parseFloat(item.award);
            item.award = numeral(item.award).format('0,0.00');
            item.levelName = item.level == 1 ? '一' : item.level == 2 ? '二' : item.level == 3 ? '三' : '未知';

            if (cate[time]) {
              cate[time].push(item);
            } else {
              cate[time] = [item];
            }
          });

          var category = [];

          for (var key in cate) {
            category.push({
              key: key,
              data: cate[key]
            });
          }

          category = category.sort((v1, v2) => {
            return util.getTime(v2.key, 'YYYY-MM-DD') - util.getTime(v1.key, 'YYYY-MM-DD');
          });

          if (category[0].key == util.formateDate(Date.now(), 'YYYY-MM-DD')) {
            category[0].key = '今日 ' + category[0].key;
          }




          this.render(listTmpl, category, this.listEl);
        }
      } else {
        this.listEl.html('<p class="empty">暂无数据</p>');

      }

      $('.J_Total').text(numeral(data.real_award).format('0,0.00'))
    });
  }



  defaults() {
    return {
      listEl: $('.list')
    }
  }
}

new Friends();