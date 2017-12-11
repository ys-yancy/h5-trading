'use strcit';

var PageBase = require('../../../app/page-base');
var config = require('../../../app/config');
// var util = require('../../../app/util');
var indexTmpl = require('./index.ejs.html');
// require('../../my/common/header');
// // require('../index/header.css');
require('../../my/common/header');
var Dialog = require('../../../common/dialog');;
// var Toast = require('../../../common/toast');
var dialogTmpl = require('./dialog.ejs.html');

class Follow extends PageBase {
  constructor() {
    super();
    this.configStatistics();

    var redirectUrl = '../login.html?src=' + encodeURIComponent(location.href);
    this.getToken(redirectUrl).then(() => {
      return this._getFollower();
    }).then(() => {
      this._bind();
    });
  }

  _bind() {
    var doc = $(document);
    var inputEl = $('input');

    doc.on('swipeLeft swipeRight', '.item-inner', $.proxy(this._swipeLeft, this));
    doc.on('touchstart', '.item-inner', $.proxy(this._touchLink, this));
    doc.on('tap', '.J_Unfollow', $.proxy(this._unfollow, this));
    doc.on('tap', '.J_Follow', $.proxy(this._follow, this));

    doc.on('tap', '.J_Del', (e) => {
      inputEl.val('');
      $('form').submit();
    });

    $('form').on('submit', (e) => {
      e.preventDefault();
      var val = inputEl.val();
      var itemEls = $('.item');
      var found = 0;

      if (!val) {
        itemEls.show();
        if (this.list.length > 0) {
          $('#J_Empty').hide();
        }
        return;
      }

      this.list.forEach((item, index) => {
        if (item.nickname.indexOf(val) === -1) {
          // console.log(itemEls.get(index))
          $(itemEls.get(index)).hide();
        } else {
          found++;
        }
      });

      if (found === 0) {
        $('#J_Empty').show();
      }

    });

    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }
  }

  _swipeLeft(e) {
    var curEl = $(e.currentTarget);
    // console.log('swipeLeft')

    if (e.type === 'swipeLeft') {
      curEl.addClass('unfold');
      this.swipeTouch = true;
    } else {
      curEl.removeClass('unfold');
      this.swipeTouch = false;
    }
  }

  _touchLink(e) {
    // console.log('touch')
    var curEl = $(e.currentTarget);

    if (this.swipeTouch) {
      if (!curEl.hasClass('unfold')) {
        $('.link').removeClass('unfold');
      }
    }

  }

  _follow(e) {
    var curEl = $(e.currentTarget);
    var code = curEl.attr('data-code');

    this.ajax({
      url: '/v1/user/following/',
      type: 'post',
      data: {
        access_token: this.cookie.get('token'),
        following_invite_code: code
      }
    }).then(() => {
      curEl.hide();
    });
  }
  
  _unfollow(e) {
    var curEl = $(e.currentTarget);
    var code = curEl.attr('data-code');

    var dialog = new Dialog({
      isShow: true,
      tmpl: this.render(dialogTmpl),
      confirmCallback: () => {
        this.ajax({
          url: '/v1/user/following/',
          type: 'DELETE',
          data: {
            access_token: this.cookie.get('token'),
            following_invite_code: code
          }
        }).then(() => {
          curEl.parent('.item').remove();
          dialog.destroy();
          $('.J_DialogMask').hide();
        });
      }, 
      cancleCallback: () => {
        // console.log('cancel')
        curEl.parent('.item-inner').trigger('swipeRight');
      }
    });
  }

  _getFollower() { //
    return this.ajax({
      // url: 'v1/user/0/follower/',
      url: 'v1/user/following/',
      data: {
        access_token: this.cookie.get('token')
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

      this.list = data.list;

      this.render(indexTmpl, data.list, $('.list'));

      if (this.list.length === 0) {
        $('#J_Empty').show();
      }


    });
  }



  defaults() {
    return {
      listEl: $('.list')
    }
  }
}

new Follow();