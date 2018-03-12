'use strict';

import Base from '../../app/base';
import Cookie from '../../lib/cookie';
import Sticky from '../../common/sticky';
import GoBack from '../../common/go-back';
import InfinityScroll from '../../common/infinite-scroll';
import tmpl from './index.ejs';

class Inbox extends Base {
    constructor(config) {
        super(config);

        if (Cookie.get('token')) {
            this._init();
        } else {
            location.href = './option.html';
        }
    }

    _init() {
        this._bind();
        this._initSticky();
        this.initInfinite = this._initInfinite();

        new GoBack();
    }

    _bind() {
        var doc = $(document);

        doc.on('touchend', '.J_Item', $.proxy(this._switch, this));
        doc.on('touchend', '.J_Edit', $.proxy(this._edit, this));
        doc.on('touchend', '.J_Check', $.proxy(this._check, this));
        doc.on('touchend', '.J_AllCheck', $.proxy(this._checkAll, this));
        doc.on('touchend', '.J_AllSel', $.proxy(this._del, this));
        doc.on('touchend', '.J_Readed', $.proxy(this._readed, this));
    }

    _switch(e) {
        var curEl = $(e.currentTarget),
            index = curEl.index();
        var type = this.types[index];

        if (curEl.hasClass('active')) {
            return;
        }

        curEl.siblings().removeClass('active');
        curEl.addClass('active');
        this.contentEl.html('');
        this._hideEditMode();
        this.initInfinite && this.initInfinite._destory(this.initInfinite);
        this.initInfinite = this._initInfinite(type);
    }

    _edit(e) {
        var curEl = $(e.currentTarget);
        var setEl = $('.settings');
        
        if (curEl.hasClass('active')) {
            this._hideEditMode(curEl);
            return false;
        }
        this.editEl.addClass('unfold');
        this.contentEl.addClass('unfold');
        curEl.addClass('active')
            .removeClass('icon')
            .text('取消');

        setEl.hide();
        return false;
    }

    _hideEditMode(curEl) {
        var setEl = $('.settings');
        setEl.show();
        curEl = curEl || $('.J_Edit');
        this.editEl.removeClass('unfold');
        this.contentEl.removeClass('unfold');
        curEl.addClass('icon')
            .removeClass('active')
            .text('');
    }
    
    _check(e) {
        var curEl = $(e.currentTarget),
            parentEl = curEl.parents('.info-item');
        
        if (curEl.hasClass('checked')) {
            curEl.removeClass('checked');
            parentEl.removeClass('checked');
            return;
        }

        curEl.addClass('checked');
        parentEl.addClass('checked');
    }

    _checkAll(e) {
        var curEl = $(e.currentTarget),
            checkEls = $('.check', this.contentEl),
            infoItems = $('.info-item', this.contentEl);
        
        if (curEl.hasClass('checked')) {
            curEl.removeClass('checked');
            checkEls.removeClass('checked');
            infoItems.removeClass('checked');
            return;
        }

        curEl.addClass('checked');
        checkEls.addClass('checked');
        infoItems.addClass('checked');
    }

    _del() {
        var params = this._getDelParams();

        if (!params.ids) {
            return;
        }

        this.ajax({
            url: '/v1/user/inbox/message/delete/',
            data: params,
            type: 'POST'
        }).then((data) => {
            this.checkedEls.remove();
            this.checkedEls = null;
            this._hideEditMode();
        })
    }

    _readed() {
        var params = this._getDelParams();

        if (!params.ids) {
            return;
        }

        this.ajax({
            url: '/v1/user/inbox/message/delete/',
            data: params,
            type: 'POST'
        }).then((data) => {
            $('.dot', this.checkedEls).remove();
            this._hideEditMode();
        })
    }

    _getDelParams() {
        var checkedEls = $('.info-item.checked');
        var ids = [];
        for (var i = 0, len = checkedEls.length; i < len; i++) {
            var item = $(checkedEls[i]),
                id = item.attr('data-id');

            if (id != null || id != '' || id != undefined) {
                ids.push(id);
            }
        }

        this.checkedEls = checkedEls;

        return {
            access_token: Cookie.get('token'),
            ids: ids.join(',')
        }
    }

    _initInfinite(type) {
        var limit = 20,
            params = {
                access_token: Cookie.get('token'),
                type: type,
                start: 0,
                limit: limit
            }
        
        var url = this._getUrl();
        
        return new InfinityScroll({
            loadingConfig: {
                el: $('#J_Loading'),
                needInit: false,
            },
            params: params,
            el: this.contentEl,
            url: url,
            tmpl: tmpl,
            emptyTmpl: this.emptyTmpl,
            infinite: true,
            beforeRequest: function(params) {
                return {
                    limit: limit,
                    start: params.page * limit
                }
            },
            parse: function(data, params) {
                var hasNextPage = true;

                if (data.data.length === 0 || data.data.length < limit) {
                    hasNextPage = false;

                    return {
                        data: data.data,
                        hasNextPage: hasNextPage
                    }
                }

                return data;
            }
        })

    }

    _getUrl() {
        return '/v1/user/inbox/message/list/';
    }

    _initSticky() {
        $('nav').sticky();
    }

    defaults() {
        return {
            editEl: $('#J_EditWrapper'),

            contentEl: $('#J_Container'),

            emptyTmpl: '<li class="empty">当前没有消息</li>',

            //type: 1：智能提示；2：赠金；3：交易；4：账户；5：公告；6：市场；7：跟单。
            types: [void 0, 6, 3, 2, 4, 5]
        }
    }
}

new Inbox();