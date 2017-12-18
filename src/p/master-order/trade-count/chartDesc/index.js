"use strict";

require('./index.css');
var Base = require('../../../../app/base');
var tmpl = require('./index.ejs.html');
class ChartDesc extends Base {
	constructor(config) {
		super(config)

		this._init();
	}

	_init() {
		this.show();
	}

	_lazyBind() {
		$(document).on('click', (e) => {
			var targetEl = $(e.toElement || e.relatedTarget || e.target);
			if (targetEl.hasClass('chart-data-desc')) {
				return
			}
			this.el.hide()
		})
	}

	show() {
		$('.trade-count-chart-desc-wrapper').remove();
		this.el = this.renderTo(tmpl, {content: this.content}, $('body'));
		this.setPos();
		this._lazyBind();
	}

	hide() {
		this.el.remove();
	}

	setPos() {
		var position = this.referEl.offset();
		this.el.css({
			top: position.top
		}).show();
	}
}

module.exports = ChartDesc;