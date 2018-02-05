'use strict';

import Base from '../../app/base';
import Uri from '../../app/uri';
import Cookie from '../../lib/cookie';

class HelpDetail extends Base{
    constructor(config){
        super(config);

        this._getData();
    }

    _getData() {
        this.ajax({
            url: 'http://122.70.128.232:8100/v1/article/detail/',
            data: {
                access_token: 'token6062',
                article_id: new Uri().getParam('article-id'),
                type: 'help'
            },
            unjoin: true
        }).then(data => {
            data = data.data;
            this._setTitle(data.title);
            $('.J_Content').html(data.content)
        })
    }

    _setTitle(title) {
        $('h1', '#J_Header').text(title)
    }
}

new HelpDetail();