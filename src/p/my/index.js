"use strict";

var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var Cookie = require('../../lib/cookie');
var Dialog = require('../../common/dialog');
var Toast = require('../../common/toast');
var Config = require('../../app/config');
var Util = require('../../app/util');
var Sticky = require('../../common/sticky');
var CustomerService = require('../../common/customer-service');
var tmpl = require('./logout.ejs');
var qrCodeTmpl = require('./qrCode.ejs');
var spTmpl = require('./sp.ejs');
var sHdepositTmpl = require('./showHdeposit.ejs');

function My() {
  My.superclass.constructor.apply(this, arguments);
  var self = this;
  this.getToken().then(function() {
    self.init();
  });
}

Base.extend(My, PageBase, {
  init: function() {
    this._bind();
    this._initAttrs();
    this._getData();
    this._requires();
    this._getLottery();
    this._getServicePhone();
    this.configStatistics();
    this._getAccount();
    this.qrOnly = true;
    this.kf_phone = '';
  },

  _bind: function() {
    var doc = $(document);
    $('#J_Img').attr('src', getDefaultIconWL());
    $('.J_Standard').on('click', $.proxy(this._switchUI, this));
    doc.on('click', '.J_Recharge', (e) => {
      // this.cookie.set('type', 'real');
      location.href = './recharge.html?src=' + encodeURIComponent(location.href);
    });

    // 整个未登录条都可以点
    doc.on('tap', '#J_NotLogin', $.proxy(this._login, this));
    doc.on('tap', '.weixin', $.proxy(this._qrCode, this));
    doc.on('tap', '.servicePhone', $.proxy(this._showSWCode, this));

    if (Cookie.get('token') && Cookie.get('phone')) {
      // $('.my-feedback').parent().after('<li><a class="my-reallogout J_VerifyLogin" id="J_SwitchAccount" href="javascript:;">退出登录<span class="arrow-right"></span></a></li>');
      doc.on('tap', '.J_Logout', $.proxy(this._switchAccount, this));
      $('.logout-wrapper').show();
      $('.recovery-trade-password-link').show();
    }

    if (Cookie.get('real_token') && !getIsOnlyShowReal()) {
      $('.aboutus').parent().after('<li><a class="my-reallogout J_VerifyLogin" id="J_RealLogout" href="javascript:;">退出实盘登录<span class="arrow-right"></span></a></li>');
      doc.on('tap', '#J_RealLogout', $.proxy(this._logout, this));
    }

    //如果是kstj，则不需要入金页面
    if ( getWXWL() == 'kstj' ) {
      doc.on('tap', '.H_Recharge', $.proxy(this._show_h_deposit,this));
      $('.J_Recharge').hide();
      $('.H_Recharge').show();
    }

    // 如果是Android内置webview就不显示下载条和抽奖入口
    if (!Config.isAndroidAPK() && getIfShowDLinkWL()) {
      // $('.my-lootery').parent().remove();
      // $('#J_Banner').remove();
      $('.footer').append('<div class="app-guide" id="J_Banner">\
                <span class="desc">更多实用功能尽在APP</span>\
                <a class="download" href="http://a.app.qq.com/o/simple.jsp?pkgname=com.invhero.android">下载APP</a>\
                </div>');
    }

    // 更换个人页面链接
    var inviteCode = Cookie.get('inviteCode');
    if (inviteCode) {
      $('#J_Profile').attr('href', './my/profile.html?inviteCode=' + inviteCode + '&from=' + encodeURIComponent(location.href));
    }


    var wx = getWeiXinWL();

    var profileEl = $('#J_Modify_Profile')
    profileEl.attr('href', profileEl.attr('href') + '?from=' + encodeURIComponent(location.href));

    // 需要显示官方微信
    // https://mp.weixin.qq.com/mp/profile_ext?action=home&scene=110&__biz=MzA5NTMzMjU5NA==#wechat_redirect

    var wx2 = getWeiXin2WL();
    if (wx2 && wx2 != '') {
      $('.bd-second').append('<li><a class="weixin">官方微信公众号: ' + wx2 + '</a></li>');
    }

    var ws = getWebsiteWL();
    if (ws && ws != '') {
      $('.bd-second').append('<li><a href="' + wx2 + '" class="weixin">官方网站: ' + ws + '</a></li>');
    }

    // 0722 排行榜挪到 发现 栏目中      
    /*
    if (getIfUseRanking()) {
        $('#J_Rank').append('<li>\
            <a class="my-gift J_VerifyLogin" href="./my/sort-month.html?header=true&from=' + encodeURIComponent(location.href) + '">\
                <span>排行榜</span>\
                <span class="arrow-right"></span>\
            </a>\
        </li>');
    }
    */

    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }

  },

  _show_h_deposit: function() {
    new Dialog({
      isShow: true,
      tmpl: this.render(sHdepositTmpl),
      confirmCallback: hasMind
    });
    function hasMind() {
      // alert('hasMind');
      $('.show_H_deposit').remove();
    }

  },

  _showSWCode: function() {
    new Dialog({
      isShow: true,
      tmpl: this.render(spTmpl),
      confirmCallback: agreement
    });
    $('#serQrCode')[0].src = getServiceQr();
    $('#serQrCode_mask')[0].src = getServiceQr();
    setInterval(function() {
        $('.dialog-logout-serviceCode').css('display', 'block');
    }, 500);

    function agreement() {
      $('.dialog-logout-serviceCode').remove();
      $('.serviceQRLogout-mask').remove();
    }
  },

  _qrCode: function() {

    var self = this;
    if (Cookie.get('agreeQrCode') == 1) {

    } else if (self.qrOnly) {
      self.ajax({
        url: '/v1/user/profile/weixin_QR_code/?access_token=' + Cookie.get('token') + "&wl=" + Cookie.get('wl')
      }).then((data) => {
        if (data.data != '') {
          self.qrOnly = false;
          var path = getAndroidAvatarUrl() + data.data.substr(8);
          var dialog3 = new Dialog({
            isShow: true,
            tmpl: this.render(qrCodeTmpl),
            cancleCallback: noagreement,
            confirmCallback: agreement
          });
          $('#myQrCode')[0].src = path;
          $('#myQrCode_mask')[0].src = path;
          setInterval(function() {
            $('.weixinQRLogout-mask').css('display', 'block');
          }, 500);



          function noagreement() {
            $('.weixinQRLogout-mask').remove();
            self.qrOnly = true;
          }

          function agreement() {
            // Cookie.set('agreeQrCode', '1', {
            //   expires: Infinity
            // });
            $('.weixinQRLogout-mask').remove();
            self.qrOnly = true;
          }
        }
        if (data.data == '') {
          self.qrOnly = false;
        }
      }).fail(function(data) {
        self.qrOnly = true;
      });
    }
  },

  // 切换交易UI
  _switchUI: function() {
    // 标准交易是4, 极速交易是6
    if (this.tradingUI == 4) {
      var dialog = new Dialog({
        isShow: true,
        tmpl: `<div class="dialog-standard dialog-logout" id="J_Dialog">
                   <span class="wrapper-icon"><span class="icon"></span></span>
                   <div class="dialog-content J_Content">
                       <p class="title">当前交易模式：极速交易</p>
                       <div class="desc">已为您切换至极速交易限定品种请在【自选】页面查看</div>
                   </div>
                   <div class="dialog-buttons clearfix">
                       <span class="dialog-btn J_DialogClose close" id="J_DialogSetupCancel">我知道了</span>
                   </div>
                </div>
                <div class="dialog-mask J_DialogMask"></div>`,
      });

      this.tradingUI = 6;
      $('.J_Standard').addClass('off');
    } else {
      this.tradingUI = 4;
      $('.J_Standard').removeClass('off');
    }
    Cookie.set('tradingUI', this.tradingUI);
  },

  _getServicePhone: function(token) {
    var self = this;
    return this.ajax({
      url: '/v1/customer_call',
      data: {
        access_token: this.cookie.get('token'),
        _r: Math.random()
      }
    }).then(function(data) {
      var h;
      self.kf_phone = data.data.phone;
      if (Config.isAndroidAPK()) {
        h = 'invhero-android:call?phone=' + data.data.phone;
      } else {
        h = 'tel:' + data.data.phone;
      }

      var wx = data.data.weixin;
      if (wx && wx != '') {
        var wxText;
        var wxId = getWXIDWL();
      // 如果有微信ID就添加关注
      if (wxId) {
        wxText = '<li><a class="weixin">官方微信: ' + wx + '</a></li>';
      } else {
        wxText = '<li><a class="weixin">关注官方微信: ' + wx + '</a></li>';
      }
        $('.bd-second').append(wxText);
      }

      // 显示客服电话
      if ( showServicePhone() ) {
        $('.bd-second').append('<li>\
                  <a class="weixin" href="' + h + '">客服电话: ' + data.data.phone + '</a>\
              </li>');
      }
      if (showServiceWeixin()) {
        $('.bd-second').append('<li>\
                  <a class="servicePhone" href="' + h + '">客服微信: ' + getServiceWeixin() + '</a>\
              </li>');
      }
    });
  },

  _switchAccount: function() {
    // if (this.isDemo()) {
    //     location.href = './recharge.html?src=' + encodeURIComponent(location.href);
    // } else {
    //     location.href = './recharge.html?src=' + encodeURIComponent(location.href);
    // }
    var dialog = new Dialog({
      isShow: true,
      tmpl: this.render(tmpl),
      confirmCallback: logout
    });

    function logout() {

      Cookie.expire('real_token');
      Cookie.expire('phone');
      // 不保留登录状态
      Cookie.expire('goType');
      Cookie.expire('type');

      Cookie.expire('uuid');
      Cookie.expire('inviteCode');
      Cookie.expire('token');
      Cookie.expire('wl');
      Cookie.expire('referCode');

      if (Config.isAndroidAPK()) {
        // android退出
        window.location = './android-login.html';
      } else {
        window.location = getLoginWL();
      }
    }
  },

  _login: function() {
    var self = this;
    this.login().then(function() {
      // var phone = Cookie.get('phone');
      // phone = phone.replace(phone.substr(3, 4), "****");
      //$('#J_Phone').html(phone);
    });
  },

  _logout: function() {
    Cookie.expire('real_token');
    Cookie.expire('goType');
    Cookie.set('type', 'demo');
    $('#J_RealLogout').parent().remove();
    new Toast('成功退出实盘登录,可继续使用模拟帐号');
  },

  _initAttrs: function() {
    var token = this.cookie.get('token');

    var chargeEl = $('.J_Recharge');
    var href = chargeEl.attr('href');
    href += '?src=' + encodeURIComponent(location.href);

    chargeEl.attr('href', href);

    this.tradingUI = Cookie.get('tradingUI') || getDefaultTradingUI();
    if (this.tradingUI == 4) {
      $('.J_Standard').removeClass('off');
    } else {
      $('.J_Standard').addClass('off');
    }

    if (getHelpLink() != '') {
      $('.useHelp a').attr('href',getHelpLink());
      $('.useHelp').css('display', 'block');
    }

    if( Util.isWeixin() && !getWeiXinIsHasReal() ) {
      chargeEl.hide();
    };
    // $('.name', '.content').append('<span>' + token + '</span>');
  },

  _getData: function() {
    var self = this;
    this.getAccount().then(function(account) {
      $('#J_HDName').text(account.nickname);



      $('#J_Phone').text(account.phone);
      $('#J_InviteCode').text(account.invite_code);

      if (account.avatar) {
        var avatar = Config.getAvatarPrefix(account.avatar);
        $('#J_Img').attr('src', avatar);
      }

      // 设置商城链接
      if (account.id) {
        var ele = $('#J_Market');
        ele.attr("href", ele.attr("href") + "?id=" + account.id + "&token=" + self.cookie.get('token'));
      }
    });
  },

  _getLottery: function() {
    var self = this;

    this.ajax({
      url: '/v1/user/hongbao',
      data: {
        access_token: this.cookie.get('token')
      }
    }).then(function(data) {
      var num = 0;

      $.each(data.data, function(index, item) {
        // 有效红包才提示
        if (item.status == 0 && item.amount !== 0 && Date.now() <= Date.parse(item.expire_time.replace(/-/g, '/'))) {
          ++num;
        }
      });

      if (num > 0) {
        $('#J_LotterNum').text(num).show();
      }
    });
  },

  _requires: function() {
    // new CustomerService();

    $('header').sticky();
  },

  _getAccount: function() {

    var self = this,
      type = this.isDemo() ? 'demo' : 'real',
      typeTag = 'init-' + type;

    if (this[typeTag]) {
      this._toggleAccount();
      return;
    }

    this.getAccount().then(function(data) {
      self.account = data.account;
      return self.getCurrentOrderList();
    }).then(function(data) {
      self.orderList = data;
      self[type + 'OrderList'] = data;
      self.broadcast('get:orderList', data);
      self.getFloatingProfit(self.account, data.list, data.symbols).done(function(profit, floatOption) {
        var netDeposit = parseFloat(self.account[type].balance) + parseFloat(profit);
        var freeMargin = netDeposit - parseFloat(data.margin);
        var rate = data.margin === 0 ? '--' : ((netDeposit / parseFloat(data.margin)) * 100).toFixed(2);
        var rate = rate === '--' ? '--' : parseFloat(rate);



        // var tmplData = {
        //     netDeposit: netDeposit,
        //     freeMargin: freeMargin,
        //     profit: profit,
        //     rate: rate,
        //     type: type,
        //     eidt: self.edit,
        //     init: self.hasInit,
        //     // // balance: this._getBalance(),
        //     // page: this.page
        // };
        $('.J_Account').html('<span>我的资产：$' + (netDeposit || 0).toFixed(2) + '</span><span class="profit">浮动盈亏：$' + (profit || 0).toFixed(2) + '</span>')

        // console.log(tmplData)
      });
    });
  },

  attrs: {
    RealLogoutTmpl: [
      '<li>',
      '   <a class="my-reallogout J_VerifyLogin" id="J_RealLogout" >退出实盘账户',
      '       <span class="guide">',
      '           <span class="triangle"></span>',
      '       </span>',
      '   </a>',
      '</li>'
    ].join('')
  }
});

new My();
