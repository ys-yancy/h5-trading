"use strict";

// require('./index.css');

var PageBase = require('../../app/page-base');
var Util = require('../../app/util');
var tmpl = require('./index.ejs');

class Message extends PageBase {
    constructor(config) {
        super(config);

        // this.render(tmpl, {}, this.el);

        this._getData();
        this._bind();
        this.configStatistics();
    }

    _bind() {
        var doc = $(document);

        doc.on('tap', '.J_Type', $.proxy(this._select, this));

        // 添加默认微信分享
        if (this.isWeixin()) {
          this.setupWeiXinShare('default_invite');
        }
    }

    _select(e) {
        var curEl = $(e.currentTarget);

        if (!curEl.hasClass('active')) {
            curEl.siblings().removeClass('active');
            curEl.addClass('active');

            this._getData(curEl.index());
        }
    }

    _getData(index) {
        this.ajax({
            url: '/v1/marquee/',
            data: {
                tags: this.tags[index || 0],
                start: 0,
                end: 10000,
                include_expired: 1
            }
        }).then((data) => {
            // console.log(data);
            data = data.data;

            data = data.sort((v1, v2) => {
                return Util.getTime(v1.start) > Util.getTime(v2.start) ? -1 : 1;
            });

            this.render(tmpl, data, $('#J_List'));
            this._pos();

        });
    }

    _pos() {
        $.each($('.arrow-right'), function(index, item) {
            item = $(item);
            var parent = item.parent().parent();

            item.css({
                top: (parent.height() - item.height()) / 2
            });
        });
    }

    defaults() {
        return {
            tags: [
                'recommend',
                'news',
                'activity',
                'other'
            ]
        }
    }

}

new Message();