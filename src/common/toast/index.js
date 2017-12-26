"use strict";

function Toast(text, disappearTime) {
    var self = this;

    text = text || '';
    disappearTime = disappearTime || 3000;
    this._init(text, disappearTime);
}

$.extend(Toast.prototype, {
    _init: function(info, disappearTime) {
        var self = this;

        self.show(info);
        if (disappearTime) {
            self.timer = setTimeout(function() {
                self.hide();
            }, disappearTime);
        }
    },
    show: function(info) {
        var self = this;
        var infoCon, toastCon;

        if (self.timer) {
            clearTimeout(self.timer);
        }

        infoCon = document.createTextNode(info);
        toastCon = document.createElement('div');
        toastCon.className = 'com-toast';
        toastCon.style.height = '2.4rem';
        toastCon.style.lineHeight = '2.4rem';
        toastCon.style.padding = '0';
        toastCon.style.paddingLeft = '1.2rem';
        toastCon.style.left = 0;
        toastCon.style.right = 0;
        toastCon.style.bottom = '-2.4rem';
        toastCon.style.fontSize = '.6rem';
        toastCon.style.background = '#000';
        toastCon.style.transform = 'translateX(0)';
        toastCon.style.webkitTransform = 'translateX(0)';
        toastCon.style.transition = 'bottom .3s ease';
        toastCon.style.webkitTransition = 'bottom .3s ease';
    
        toastCon.appendChild(infoCon);
        document.body.appendChild(toastCon);

        self.toastCon = toastCon;
        
        setTimeout(function() {
            toastCon.style.bottom = '-3px';
        }, 0)
    },
    hide: function() {
        var self = this;
        if (self.toastCon) {
            $(self.toastCon).remove();
        }
    }
});

module.exports = Toast;