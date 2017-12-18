'use strict';

require('./index.css');
var Base = require('../../../../../../app/base');
var tmpl = require('./index.ejs.html');

class CancelFollowOrderDialog extends Base {
	constructor(config) {
		super(config);

		this._bind();
		this.show();
	}

	_bind() {
		var doc = $(document);
		doc.on('click', '.J_ConfirmCancelFollowOrder', () => {
			this.fire('confirm');
			this.hide();
		});

		doc.on('click', '.J_CloseCancelFollowOrderDialog', () => {
			this.hide();
		})
	}

	show() {
		this.el = this.renderTo(tmpl, {}, $('body'));
	}

	hide() {
		this.el.remove();
	}
}

module.exports = CancelFollowOrderDialog;