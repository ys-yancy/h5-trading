'use strict';

require('./index.css');
var Base = require('../../../app/base');
var Dialog = require('../../../common/dialog');
var tmpl = require('./index.ejs.html');

export default class CancelFollowOrderDialog extends Base {
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
		this.dialog.show();
	}

	hide() {
		this.dialog.hide()
	}

	initDialog() {
		this.dialog = new Dialog({
	      isShow: false,
	      tmpl: tmpl,
	      confirmCallback: ()=> {},

	      cancleCallback:()=> {}
	    });
	}
}
