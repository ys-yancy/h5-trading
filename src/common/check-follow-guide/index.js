'use strict';
var Cookie = require('../../lib/cookie');
export default class CheckFollowGuide{
    constructor(config) {
        var new_follow_guide = Cookie.get('new_follow_guide');

        if (!getUseNewFollowGuide() || new_follow_guide == 1) {
            return;
        }

        if (!new_follow_guide || (new_follow_guide && new_follow_guide != 1)) {
            window.location.href = './follow-guide.html';
        }
    }
}