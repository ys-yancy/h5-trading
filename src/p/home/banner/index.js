"use strict";
require('./index.css');
import Base from '../../../app/base';
import tmpl from './index.ejs';
import Dialog from '../../../common/dialog';
import '../../../common/slider';

export default class HomeBanner extends Base {
	constructor(config) {
        super(config);
        this._getData();
    }

    _lazyBind() {
        $('#slider').on('touchend', $.proxy(this._showActiveContent, this));
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
            !getActiveTitle() || this._lazyBind();
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

    _showActiveContent() {
        this.doalog ? this.doalog.show()
            : (this.doalog = new Dialog({
                isShow: true,
                tmpl: this.render(this.tmpl)
            }))
    }

    defaults() {
        return {
            tmpl: `<div class="dialog dialog-active-content" id="J_Dialog">
                <span class="wrapper-icon"><span class="icon"></span></span>
                <div class="dialog-content">
                    <p class="title"><%= getActiveTitle() %></p>
                    <div class="content J_Content"><%= getActiveContent() %></div>
                </div>
                <div class="dialog-buttons clearfix">
                    <span class="dialog-btn J_DialogClose close" id="J_DialogSetupCancel">我知道了</span>
                </div>
            </div>
            <div class="dialog-mask J_DialogMask"></div>`,
        }
    }
}