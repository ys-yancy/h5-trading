// es6 类和模块 其实默认就是严格模式
'use strict';

import Base from '../../app/base';
import Uri from '../../app/uri';
import Cookie from '../../lib/cookie';
import GoBack from '../../common/go-back';
import Header from '../../common/header';

class Help extends Base {
    constructor(config) {
        super(config);

        this._requires();
        this._getData();
        this._initAttrs();
    }

    _getData() {
        this.ajax({
            url: '/v1/article/title_list/',
            data: {
                type: 'help',
                access_token: Cookie.get('token')
            }
        }).then(data => {
            data = data.data;
            this.render(this.tmpl, data, this.containerEl);
        })
    }

    _requires() {
        new GoBack();
        new Header();
    }

    _initAttrs() {
        var backEl = $('.go-back');
        var params = new Uri().getParams();
        var backUrl = params.from || params.src;

        if (!backUrl) {
            backEl.attr('href', './' + getHomeUrl());
        }
    }

    defaults() {
        return {
            containerEl: $('.J_Content'),
            tmpl: [
                '<%data.forEach(function(item) {%>',
                    '<li class="item">',
                        '<a class="bd-color" href="./help-detail.html?article-id=<%=item.article_id%>">',
                            '<span class="item-title">',
                                '<%= item.title %>',
                            '</span>',
                        '</a>',
                    '</li>',
                '<%})%>',
                '<%if (data.length == 0) {%>',
                    '<li class="no-list">暂无相关内容</li>',
                '<%}%>'
            ].join(' ')
        }
    }
}

new Help();