var Base = require('../../app/base');
var iScroll = require('../../lib/scroll');
function IScroll() {
    IScroll.superclass.constructor.apply(this, arguments);
}

Base.extend(IScroll, Base, {
    create: function () {
        this.options = this.options || {};
        this.config = $.extend(this.defaultCom, this.options);
        return new iScroll.iScroll(this.wrapper, this.config);
    },
    attrs: {
        defaultCom: {
            probeType: false,
            hScroll: false,
            vScroll: true,
            hScrollbar: false,
            vScrollbar: false,
            bounce: false,
            disableMouse: false,
            disablePointer: false,
            click: false,
            tasp: true,
            shrinkScrollbars: false,
            useTransition: true
        }
    }
})

module.exports = IScroll;