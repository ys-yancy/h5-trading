"use strict";

// require('./index.css');
var Uri = require('../../app/uri');

class MessageDetail {
    constructor(config) {

        var params = new Uri().getParams();

        $('#J_Title').text(getWLName());

        $('.go-back').attr('href', params.src);

        $('.content').html('<iframe width="100%" src="' + params.goHref + '"></iframe');

        $('iframe').height($(window).height() - $('header').height());
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

new MessageDetail();