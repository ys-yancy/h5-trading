'use strict';

var PageBase = require('../../../app/page-base');
var Uri = require('../../../app/uri');
require('../common/header');
var Info = require('./info');
var List = require('./list');
var Data = require('./data');
var Header = require('../../../common/header');
var Dialog = require('../../../common/dialog');
var Toast = require('../../../common/toast');
var tmpl = require('./index.ejs.html');

class Profile extends PageBase {
  constructor() {
    super();
    this.configStatistics(); 

    new Header();

    var params = new Uri().getParams();
    var uid = params.uid;
    this.inviteCode = params.inviteCode.substr(0, 6);


    // 转发人的邀请码, 如果有转发人, 那么久使用转发人的邀请码去跳转登录页
    this.repostInviteCode = params.repostInviteCode;
    if (this.repostInviteCode) {
      this.repostInviteCode = this.repostInviteCode.substr(0, 6);
    }


    // 匿名用户访问此页, 需要显示注册入口
    if (!this.cookie.get('token')) {
      var hrefUrl = getWXInviteUrlWL() + (this.repostInviteCode ? this.repostInviteCode : this.inviteCode) + '&source=profile';
      if ( getIsNewShareWl() ) {
        hrefUrl = getNewShareWl() + uid;
      }
      $(document.body).append('<a href="' + hrefUrl + '" class="register">注册即获赠金<span id="J_Bonus"></span> 与Ta一起投资</a> ');

      $('#J_Bonus').text('$' + (getRegBonus() + getInviteRegBonus()));
    } else {
      // 是否允许跟随
      this._isAllow().then((allow) => {
        // 不允许跟随
        if (!allow) {
          $(document.body).append('<span class="allow">Ta不希望被别人关注</span>');
        } 
        // 允许跟随
        else {
          // return this._getFollower();
          // 判断是否已经跟随
          return this._ifFollowing().then((following) => {
            var span;
            if (!following) {
              span = '<span class="allow J_Follow">关注Ta，获取Ta的交易动态</span>';
            } else {
              span = '<span class="allow J_UnFollow">已关注</span>';
            }

            $(document.body).append(span);
          });
        }
      });
    }

    /* 
    this.getToken('../login.html').then(() => {
      return this._requires();
    });
    */

    // this._getData(); 
    this._requires();
    this._bind();
  }

  _bind() {
    var doc = $(document);

    doc.on('tap', '.J_Follow', (e) => {
      this._setFollow().then((data) => {
        new Toast('关注成功');
        $(e.currentTarget).replaceWith('<span class="allow J_UnFollow">已关注</span>');
      });
    });

    doc.on('tap', '.J_UnFollow', (e) => {
      var dialog = new Dialog({
        isShow: true,
        tmpl: this.render(tmpl),
        confirmCallback: () => {
          this._setFollow(true).then(() => {
            new Toast('取消关注成功');
            $(e.currentTarget).replaceWith('<span class="allow J_Follow">关注Ta，获取Ta的交易动态</span>');
            dialog.destroy();
            $('.J_DialogMask').hide();
          });
        }
      });

    });

    
  }


  _requires() {
    new Info({
      el: $('#J_Info'),
      inviteCode: this.inviteCode
    });

    new List({
      el: $('#J_ListCurrent'),
      historyEl: $('#J_ListHistory'),
      inviteCode: this.inviteCode
    });

    new Data({
      el: $('#J_Data'),
      inviteCode: this.inviteCode
    })
  }

  _isAllow() {
    return this.ajax({
      url: '/v1/user/profile/permission/allow_following',
      data: {
        invite_code: this.inviteCode,
        access_token: this.cookie.get('token') || ''
      }
    }).then((data) => {
      return data.data.permission == 1;
    });
  }

  _ifFollowing() {

    return this.ajax({
      url: 'v1/user/following/existed/' + this.inviteCode,
      data: {
        access_token: this.cookie.get('token')
      }
    }).then((data) => {
      // console.log(data.data);
      return data.data.following;
    });
  }

  _setFollow(isCancel) {
    if (!isCancel) {
      return this.ajax({
        url: '/v1/user/following/',
        data: {
          access_token: this.cookie.get('token'),
          following_invite_code: this.inviteCode
        },
        type: 'post'
      });
    } else {
      return this.ajax({
        url: '/v1/user/following/',
        data: {
          access_token: this.cookie.get('token'),
          following_invite_code: this.inviteCode
        },
        type: 'DELETE'
      })

    }

  }

  _getData() {
    return this.ajax({
      url: '/v1/user/profile/order/current/',
      data: {
        invite_code: this.inviteCode
      }
    }).then((data) => {
      console.log(data);
    })
  }
}

new Profile();
