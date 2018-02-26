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
        }).then((data) => {
            data = data.data;
            this._render(data);
        })
    }
 
    _render(data) {
        data = this._getSlideData(data);
        this.render(tmpl, data, $('.km-slider-outer'));
        if (data.length > 0) {
            $('#slider').slider({
                loop: true,
                play: true,
                interval: 10 * 1000,
                duration: 1000
            });
        }  
    }

    _getSlideData(data) {
        return data.map(function(item) {
            if (item.image.indexOf('http') === -1) {
                if (item.image.indexOf('static') !== -1) {
                    item.image = getNativePlaceUrl() + item.image.substr(8);
                } else {
                    item.image = getNativePlaceUrl() + item.image;
                }
                
            }
            return item;
        });
    }
}