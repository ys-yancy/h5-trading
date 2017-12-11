"use strict";

require('../../lib/zepto');
var PageBase = require('../../app/page-base');
var Util = require('../../app/util');
var Config = require('../../app/config');
var Sticky = require('../../common/sticky');
var tmpl = require('./index.ejs');


class Friend extends PageBase {
    constructor() {
        super();
        this._initAttrs();
        this._requires();
        this.getToken().then(function() {
            this._getData();
            this._getProfit();
        }.bind(this));
        this.configStatistics();
        this._configShare();
    }

    _configShare() {
        if (this.isWeixin()) {
            this.setupWeiXinShare('invite');
        }
    }

    _initAttrs() {
        this.containerEl = $('#J_List');
        this.url = '/v1/user/0/follower/';

        $('#J_Share').attr('href', './share.html?src=' + encodeURIComponent(location.href));
        $('#J_FriendsMoney').attr('href', './weixin/friends-money.html?src=' + encodeURIComponent(location.href));

        if (Config.isAndroidAPK() || !getIfShowDLinkWL()) {
            $('#J_Banner').remove();
        }
    }

    _getData() {
        this.ajax({
            url: this.url,
            data: {
                access_token: this.cookie.get('token')
            }
        }).then(function(data) {
            data = data.data;

            if (data.length === 0) {
                // window.location = './share.html';
                $('.empty').show();
            }

            $.each(data, function(index, item) {
                var time = Util.getTime(item.created);
                item.joinDay = Util.formateDate(time, 'YYYY\.MM\.DD');

                if (item.avatar) {
                    item.avatar = Config.getAvatarPrefix(item.avatar);
                }
                item.default_avatar = getDefaultIconWL();
            });

            this.render(tmpl, data, $('#J_List'));
        }.bind(this));
    }

    _getProfit() {
        this.ajax({
            url: '/v1/user/transaction/upline_reward/',

            data: {
                access_token: this.cookie.get('token')
                    //   date: Util.getTime(Date.now() - 24 * 60 * 60 * 1000)
            }
        }).then(function(data) {
            data = data.data;

            $('.num.demo', '#J_HD').text(data.demo_award);
            $('.num.real', '#J_HD').text(data.real_award);
        }.bind(this));
    }

    _requires() {
         $('header').sticky();
    }
}

new Friend();