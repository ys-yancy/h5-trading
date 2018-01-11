'use strict';
var Uri = require('../../app/uri');

class GoBack {
    constructor() {
        var urlParams = new Uri().getParams();
        var src = urlParams.src,
            from = urlParams.from;
        
        // 优先取src属性
        var goBackUrl = src || from;
        if (goBackUrl) {
            $('.go-back').attr('href', goBackUrl);
        }
    }

}

module.exports = GoBack;