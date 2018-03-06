"use strict";
require('./index.css');
var Base = require('../../../app/base');
var Cookie = require('../../../lib/cookie');
var guide1Tmpl = require('./index.ejs');

export default class HomeGuide extends Base{
    constructor(config) {
        super(config);

        var new_home_guide = Cookie.get('new_home_guide');
        if (!getUseNewHomeGuide() || new_home_guide == 1) {
            return;
        }

        this._show();
        Cookie.set('new_home_guide', 1);
    }

    _lazyBind() {
        this.wrapEl.on('touchmove', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        this.wrapEl.on('touchend', () => {
            this._hide();
            return false;
        })
    }

    _show() {
        var wrapEl = document.createElement('DIV');

        wrapEl.style.cssText = 'position:fixed;top:0;right:0;bottom:0;left:0;z-index:10000;background:rgba(0,0,0,.5)';

        this.wrapEl = $(wrapEl);

        this.render(guide1Tmpl, {}, this.wrapEl);

        document.body.appendChild(wrapEl);

        this._lazyBind();    
    }

    _hide() {
        this.wrapEl.off();
        this.wrapEl && this.wrapEl.remove();
        this.wrapEl = null;

    }

    defaults() {
        return {
        }
    }
}