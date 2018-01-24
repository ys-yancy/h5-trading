'use strict';
import Base from '../../app/base';
import Uri from '../../app/uri';
import Sticky from '../../common/sticky';

class NewsDetail extends Base {
    constructor(config) {
        super(config);

        this._requires();
        this._getData();
        this._initSticky();
    }

    _getData() {
        if (!this.ajaxUrl) {
            return;
        }

        // 这里会出现跨域，做了一个代理
        $.ajax({
            url: this.ajaxUrl
        }).then(content => {
            var reg = /(<p>(&nbsp;|\s)<\/p>)/g;
            $('.content').html(content.replace(reg, ''));
        })
    }

    _initSticky() {
        $('#J_Header').sticky();
    }

    _requires() {
        this.ajaxUrl = new Uri().getParam('ajaxUrl');
        // this.ajaxUrl = this.ajaxUrl.indexOf('http') ? this.ajaxUrl : 'https://news.firstbkr.com' + this.ajaxUrl;s
    }
}

new NewsDetail();