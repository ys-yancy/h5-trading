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
            
            data = data.map(function(item) {
                if (item.image.indexOf('http') === -1) {
                    item.image = getNativePlaceUrl() + item.image.substr(8);
                }
                return item.image;
            });

            self.render(tmpl, data, $('.km-slider-outer'));
            if (data.length > 0) {
                $('#slider').slider({
                    loop: true,
                    play: true,
                    interval: 10 * 1000,
                    duration: 1000
                });
            }  
        })
    }
}