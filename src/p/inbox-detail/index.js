'use strict';

import Base from '../../app/base';
import Uri from '../../app/uri';
import Cookie from '../../lib/cookie';
import GoBack from '../../common/go-back';

class InboxDetail extends Base {
    constructor(config) {
        super(config);

        this._initAttrs();
        this._readContent();
        new GoBack();
    }

    _readContent() {
        this._getContent().then((data) => {
            this._setReaded();
        })
    }

    _getContent() {
        return this.ajax({
            url: '/v1/user/inbox/message/'+ this.infoId +'/detail/',
            data: {
                access_token: Cookie.get('token')
            }
        }).then((data) => {
            data = data.data;
            var title = data.title,
                content = data.content;
            if (title) {
                this._setTitle(title);
            }

            if (content) {
                $('.J_Content').html(
                    `<section class="content-inner">
                        ${content}
                    </section>`
                )
            } else {
                $('.J_Content').html('<p class="empty">暂无相关内容</p>')
            }

        })
    }

    _setReaded() {
        this.ajax({
            url: '/v1/user/inbox/message/'+ this.infoId +'/mark_read/',
            type: 'POST',
            data: {
                access_token: Cookie.get('token')
            }
        })
    }

    _setTitle(txt) {
        $('h1', '#J_Header').text(txt);
    }

    _initAttrs() {
        var urlParams = new Uri().getParams();
        this.infoId = urlParams.id;
        this.contentUrl = decodeURIComponent(urlParams.content_url);
    }
}

new InboxDetail();