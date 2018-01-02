"use strict";
require('./index.css');
var Base = require('../../app/base');
var tmpl = require('./index.ejs.html');
class SetRange extends Base {
	constructor(config) {
		super(config);

		this._bind();
		this._requires();
		this._initAttrs();
	}

	_bind() {
		this.el.bind('input propertychange', '.J_SetController', $.proxy(this._updateRange, this));
	}

	_updateRange(e) {
		var curEl = $(e.target);
		var curValue = curEl.val();
		if (this.default.isNoMonery) {
			return;
		}
		this._update(curValue);
	}

	_update(value) {
		var text;
		text = this.default.sign + ' ' + value;

		if (!this.default.isSignBefore) {
			text = value + ' ' + this.default.sign;
		}
	
		this.rangeEl.text(text);
		this._setBgColor(value);
		this.fire('setRangeSuccess', value);
	}

	_setBgColor(value) {
		var $el = $('.J_SetController', this.el),
			$step;

		$step = Math.abs(value / this.default.max);
		if (parseFloat(this.default.max) <= parseFloat(this.default.placeholder)) {
			$step = $el.attr('step') / (this.default.max) * 100;
		}

		if ( this.default.isOpp ) {
			var _val = value * 100;
			$step = Math.abs((100 - _val) / this.default.max);
		}

		if (this.default.isNoMonery) {
			return;
		}

		$el.css({
			'backgroundSize': $step + '% 100%'
		})
	}

	_requires() {
		this.default = $.extend(this.default, this.data);
		this.render(tmpl, this.default, this.el);
	}

	_initAttrs() {
		this.rangeEl = $('.J_RangeValue', this.el);
		this._setBgColor(this.data.placeholder);
	}

	defaults() {
		return {
			default: {
				max: 5000,
				min: 20,
				step: 20,
				placeholder: 100,
				minMonery: 1000, // 离最小下单相差金额
				isNoMonery: false, //是否资金充足
				isOpp: false, // 是否类似(-100px - 0)
				isSignBefore: true, // 符号是在前还是后 默认前
				sign: '$'
			}
		}
	}
}

module.exports = SetRange;