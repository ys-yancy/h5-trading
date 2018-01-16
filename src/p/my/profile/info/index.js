'use strict';

var PageBase = require('../../../../app/page-base');
var Config = require('../../../../app/config');
var tmpl = require('./index.ejs');

export default class Info extends PageBase {
  constructor(config) {
    super(config);
    this._getData();
  }

  _getData() {
    var self = this;
    
    this.ajax({
      url: '/v1/rank/config/',
      data: {
        wl: getWXWL()
      }
    }).then((data) => {
      var d = data.data;

      self.ajax({
        url: '/v1/user/profile/info', 
        data: {
          equity_threshold: d.equity_threshold,
          monthly_invite: d.monthly_invite,
          invite_code: self.inviteCode,
          access_token: self.cookie.get('token') || '',
          wl: getWXWL()
        }
      }).then((data) => {
        // console.log(data)
        data = data.data;
        data.avatar = data.avatar ? Config.getAvatarPrefix(data.avatar) : getDefaultIconWL();
        data.inviteCode = self.inviteCode;

        self.render(tmpl, data, self.el);
        // if (!data.month_ror_rank || data.month_ror_rank == 0) {
        //   $('#J_Rank').text('无');
        // } else {
        //   $('#J_Rank').text(data.month_ror_rank + ' 名');
        // }
        // var h = $('#J_Rank_Link').attr('href');
        // $('#J_Rank_Link').attr('href', h + '?from=' + encodeURIComponent(location.href));

        if (!('month_rate_of_return' in data) && ! ('gross_profit' in data)) {
          $('.detail-wrapper').html('<p class="no-auth">Ta的投资数据不允许别人查看</p>');
          $('#J_Data').remove();
        } else {
          self._getBottomData();
        }

        // 配置分享信息
        if (self.isWeixin()) {
          self.profileObject = data;
          // 当前访问页面的用户的inviteCode, 为销售准备
          self.profileObject.repostInviteCode = self.cookie.get('inviteCode');

          var html = '<span class="ui icon share J_HeadShare"></span>';
          $('#J_Header').append(html);
          $('.J_HeadShare').on('click', $.proxy(function() {
            $('#J_InfoImg').css('display', 'block');
          }, self));
          $('#J_InfoImg').on('click', $.proxy(function() {
            $('#J_InfoImg').css('display', 'none');
          }, self));
          self.setupWeiXinShare('profile');

        } else if (Config.isAndroidAPK()) {
          var title = '我伙呆! ' + data.nick_name + '的投资收益率达到了...'; // 分享标题
          var desc = '全时盈利: ' + data.gross_profit + '美元, 月均收益率: ' + (data.month_rate_of_return * 100).toFixed(2) + '%';
          var imgUrl = data.avatar; //Config.getAndroidSharePrefix() + '/img/share.jpg';
          var link = getWXDomainWL() + '/s/my/profile.html?inviteCode=' + data.inviteCode; // 分享链接
          // 需要一个新协议shareProfile
          var l = 'invhero-android:shareProfile?title=' + encodeURIComponent(title) + '&desc=' + encodeURIComponent(desc) + '&imgUrl=' + encodeURIComponent(imgUrl) + '&link=' + encodeURIComponent(link);

          // 添加分享按钮
          var html = '<a class="ui icon share" href="' + l + '"></a>';
          $('#J_Header').append(html);
        }
      });
    });
  }

  _getBottomData() {
    this.ajax({
      url: '/v1/user/mobtrade/data/',
      data: {
        invite_code: this.inviteCode,
        access_token: this.cookie.get('token') || ''
      }
    }).then((data) => {
      data = data.data[0];
      $('.J_SelfTicket').text(data.auto_tickets);
      $('.J_SelfFollow').text(data.follow_tickets);
      $('.J_Invite').text(data.invite_num);
    })
  }
  
}