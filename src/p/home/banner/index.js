"use strict";
require('./index.css');
import Base from '../../../app/base';
import tmpl from './index.ejs';
import '../../../common/slider';

export default class HomeBanner extends Base {
	constructor(config) {
        super(config);
        this._getData();
    }

    _getData() {
        var self = this;
        this.ajax({
            url: '/v1/user/banner/home/',
            data: {
                wl: getWXWL()
            }
        }).then(function(data) {
            data = data.data;
            self.render(tmpl, data, $('.km-slider-outer'));
            if (data.length > 0) {
                $('#slider').slider({
                    loop: true,
                    play: true,
                    interval: 15 * 1000,
                    duration: 1000
                });
            }  
        })
    }
}