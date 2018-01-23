var Base = require('../../../app/base');
var Cookie = require('../../../lib/cookie');
export default class HomeGuide extends Base{
    constructor(config) {
        super(config);

        this.ishide = false;
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

        this.imgEl.on('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (this.ishide) {
                this._hide();
            }

            var secondUrl = this.secondUrl;
            if (secondUrl) {
                this.ishide = true;
                this.imgEl.prop('src', secondUrl);
            }
        })
    }

    _show() {
        var wrapEl = document.createElement('DIV');
        var imgEl = document.createElement('IMG');
        wrapEl.style.cssText = 'position:fixed;top:0;right:0;bottom:0;left:0;z-index:10000;';
        imgEl.style.cssText = 'width:100%;height:100%;';
        imgEl.src = this.firstUrl;

        wrapEl.appendChild(imgEl);
        document.body.appendChild(wrapEl);

        this.wrapEl = $(wrapEl);
        this.imgEl = $(imgEl);

        this._lazyBind();
    }

    _hide() {
        this.wrapEl.off();
        this.imgEl.off();
        this.wrapEl && this.wrapEl.remove();
        this.imgEl && this.imgEl.remove();

        this.wrapEl = this.imgEl = null;

    }

    defaults() {
        return {
            firstUrl: '../../../',
            secondUrl: '../../../11',
        }
    }
}