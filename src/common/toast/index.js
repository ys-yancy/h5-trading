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
        toastCon.appendChild(infoCon);
        document.body.appendChild(toastCon);

        self.toastCon = toastCon;
    },
    hide: function() {
        var self = this;
        if (self.toastCon) {
            $(self.toastCon).remove();
        }
    }
});

module.exports = Toast;