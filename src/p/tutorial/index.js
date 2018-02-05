// es6 类和模块 其实默认就是严格模式
'use strict';

import Base from '../../app/base';
import Cookie from '../../lib/cookie';
import GoBack from '../../common/go-back';

class Tutorial extends Base {
    constructor(config) {
        super(config);

        this._getData();
        
        new GoBack();
    }

    _getData() {
        this.ajax({
            url: 'http://122.70.128.232:8100/v1/article/title_list/',
            data: {
                type: 'tutorial',
                access_token: 'token5069'//Cookie.get('token')
            },
            unjoin: true
        }).then(data => {
            data = data.data;
            this.render(this.tmpl, data, this.containerEl);
        })
    }

    defaults() {
        return {
            containerEl: $('.J_Content'),
            tmpl: [
                '<%data.forEach(function(item) {%>',
                    '<li class="item bd-color">',
                        '<a href="./tutorial-detail.html?article-id=<%=item.article_id%>&src=<%= encodeURIComponent(location.href) %>">',
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

new Tutorial();