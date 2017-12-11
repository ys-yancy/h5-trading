"use strict";

var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var Dialog = require('../../common/dialog');
var Cookie = require('../../lib/cookie');
var Util = require('../../app/util');
var Sticky = require('../../common/sticky');
var CustomerService = require('../../common/customer-service');
var tmpl = require('./tpl/index.ejs');
var dialogTmpl = require('./tpl/dialog.ejs');
var Popup = require('./popup/index');


function Lottery() {
    Lottery.superclass.constructor.apply(this, arguments);

    var self = this;
    this.login().then(function() {
        self.init();
    });
}

Base.extend(Lottery, PageBase, {
    init: function() {
        this._getData();
        this._bind();
        this._requires();
        this.configStatistics();


        if (window.location.search.indexOf('from=androidApp') != -1) {
            $('.go-back').hide();
        }
        //  console.log(template({data: [{data:1}, {data:2}]}))
    },

    _bind: function() {
        var doc = $(document);

        // 这里可能引发重复领取的BUG
        doc.on('tap', '.J_GetAll', $.proxy(this._getAll, this));
        doc.on('tap', '.J_SwitchReal', $.proxy(this._switchReal, this));

        // 添加默认微信分享
        if (this.isWeixin()) {
          this.setupWeiXinShare('default_invite');
        }
    },

    _getAll: function(e) {
        var curEl = $(e.currentTarget),
            self = this;

        if (curEl.hasClass('disable')) {
            return;
        }

        this.ajax({
            url: '/v1/hongbao/use/',
            type: 'post',
            data: {
                access_token: Cookie.get('token')
            }
        }).then(function(data) {
            self._showDialog(data.data);
            $('.J_Get', 'table').addClass('got').text('已领取');
            curEl.addClass('disable');
        });
    },

    _switchReal: function(e) {
        Cookie.set('type', 'real', {
            expires: Infinity
        });
    },

    _getData: function() {
        var self = this;

        this.ajax({
            url: '/v1/user/hongbao',
            data: {
                access_token: Cookie.get('token')
            }
        }).then(function(data) {
            var unuse = false,
                getAllEl = $('#J_GetAll');

            $.each(data.data, function(index, item) {
                // 处理过期红包
                item.formateTime = self._formate(item.expire_time);
                if (Util.getTime(item.expire_time) > Date.now()) {
                    if (item.status == 0 ) {
                        unuse = true;
                    }
                }
                // 已过期红包
                else {
                    if (item.status == 0) {
                        item.status = 2;
                    }
                }
            });

            if (unuse) {
                getAllEl.removeClass('disable');
            }
            getAllEl.show();

            if (data.data.length === 0) {
                self.render(tmpl, data.data, $('#J_Empty'));
                return;
            }

            self.render(tmpl, data.data, $('#J_List'));
        });

    },

    _formate: function(expired) {
        var date = new Date(Util.getTime(expired));
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var month = month < 10 ? '0' + month : month;
        var day = day < 10 ? '0' + day : day;
        var formate = month + '-' + day;

        return formate;
    },

    _showDialog: function(data) {
        // var html = this.render(dialogTmpl, data);
        // this.dialog = new Dialog({
        //     isShow: true,
        //     tmpl: html,
        //     confirmCallback: $.proxy(this._get, this)
        // });
        new Popup(data);
    },

    _get: function() {

    },

    _requires: function() {
        // new CustomerService();

        $('header').sticky();
    },
});

new Lottery();