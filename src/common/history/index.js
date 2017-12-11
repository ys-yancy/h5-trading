// 历史管理

var Uri = require('../../app/uri');

export default class NavHistory {
    constructor() {
        var src = new Uri().getParam('src');

        if (src) {
            $('.go-back').attr('href', src);
        }
    }
}