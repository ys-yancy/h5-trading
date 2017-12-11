'use strcit';

var PageBase = require('../../../app/page-base');
var Toast = require('../../../common/toast');
// var config = require('../../../app/config');
// var util = require('../../../app/util');
// var indexTmpl = require('./index.ejs.html');
// require('../../my/common/header');
// // require('../index/header.css');

class Publish extends PageBase {
  constructor() {
    super();
    this.configStatistics();

    this.getToken().then(() => {
      this._bind();
    });
  }

  _bind() {
    var inputEl = $('input');
    var textareaEl = $('textarea');
    var publishEl = $('.J_Publish');

    setInterval(() => {
      if (inputEl.val() && textareaEl.val()) {
        publishEl.removeClass('disable');
      } else {
        publishEl.addClass('disable');
      }
    }, 100);

    $('.J_Publish').on('tap', (e) => {
      if (publishEl.hasClass('disable')) {
        return;
      }

      var val = inputEl.val();

      this.ajax({
        url: '/v1/timeline/publish/',
        type: 'post',
        data: {
          access_token: this.cookie.get('token'),
          title: val,
          content: textareaEl.val()
        }
      }).then((data) => {
        new Toast('发表成功');

        setTimeout(() => {
          history.back();
        }, 2000)
      });
    })

    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }
  }
}

new Publish();