"use strict";

require('./index.css');
var Base = require('../../../../app/base');
var tmpl = require('./index.ejs');
function ShowQrCode() {
	ShowQrCode.superclass.constructor.apply(this, arguments);
	this.init();
}

Base.extend(ShowQrCode, Base, {
	init: function() {
		this.wrapEl = $('#J_Qr');
		this.show();
		this.bind();
	},

	bind: function() {
		this.wrapEl.on('click', '.J_CloseQrcode', $.proxy(this.hide, this));
	},

	show: function() {
		this.render(tmpl, {
			url: this.qrUrl,
			s: this.source,
			isShowImg: this.isShowImg
		}, this.el);
	},

	hide: function() {
		this.wrapEl.hide();
		// this.parent.checkOpenAccount.check();
		this.el.html('<div class="loading-wrapper">\
			<div class="ui loading" id="J_Loading">\
                <span class="circel"></span>\
            </div>\
		<div>');
	}
});

module.exports = ShowQrCode;