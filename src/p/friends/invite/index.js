'use strcit';

var PageBase = require('../../../app/page-base');
var config = require('../../../app/config');
var util = require('../../../app/util');
var indexTmpl = require('./index.ejs.html');
var newTmpl = require('./new-list.ejs');
require('../../my/common/header');

class Friends extends PageBase {
  constructor() {
    super();
    this.configStatistics();

    this.getToken().then(() => {
      this.getData();

      this._bind();
    });
  }

  _bind() {
    $(document).on('tap', '.fold', (e) => {
      var curEl = $(e.currentTarget);

      curEl.toggleClass('unfold');

      // if (curEl.hasClass('unfold')) {
        curEl.siblings('ul').toggleClass('unfold');
      // }
    })

    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }
  }


  getData() {
    this.ajax({
      url: '/v1/user/downlines/',
      data: {
        access_token: this.cookie.get('token')
      }
    }).then((data) => {
      data = data.data;
      var cate = {};
      // var categodry = [];

      data.forEach(item => {
        item.levelName = item.level;
        if (item.avatar) {
          item.avatar = config.getAvatarPrefix(item.avatar);
        } else {
          item.avatar = getDefaultIconWL();
        }

        cate[item.levelName] ? cate[item.levelName].push(item) : cate[item.levelName] = [item];
      });

      var category = [];

      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', ].forEach((key) => {
        if (cate[key]) {
          category.push({
            key: key,
            data: cate[key]
          });
        }

      });
      // this.render(indexTmpl, category, this.listEl);

      this.render(newTmpl, data, this.listEl)
    });
  }



  defaults() {
    return {
      listEl: $('.new-list')
    }
  }
}

new Friends();