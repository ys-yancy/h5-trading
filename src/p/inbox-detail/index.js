'use strict';

import Base from '../../app/base';
import Uri from '../../app/uri';
import Cookie from '../../lib/cookie';


class InboxDetail extends Base {
    constructor(config) {
        super(config);

        this._initAttrs();
        this._readContent();
    }

    _readContent() {
        this._getContent().then(() => {
            this._setReaded();
        })
    }

    _getContent() {
        return Promise.resolve(1)
    }

    _setReaded() {
        this.ajax({
            url: 'http://122.70.128.232:8100/v1/user/inbox/message/'+ this.infoId +'/mark_read/',
            type: 'POST',
            data: {
                access_token: 'token6066'//Cookie.get('token')
            },
            unjoin: true
        })
    }

    _initAttrs() {
        var urlParams = new Uri().getParams();
        this.infoId = urlParams.id;
        this.contentUrl = decodeURIComponent(urlParams.content_url);
    }
}

new InboxDetail();