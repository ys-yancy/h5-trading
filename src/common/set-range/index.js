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
		// this._setBgColor(value)
		this.fire('setRangeSuccess', value);
	}

	_setBgColor(value) {
		var $el = $('.J_SetController', this.el),
			$step;

		$step = Math.abs(value / this.default.max * 100 - 3);

		if ( this.default.isOpp ) {
			var max = this.default.max - this.default.min;
			var _step = max - Math.abs(value);
			$step = Math.abs( _step / (max) * 100);
		}

		if (this.default.isNoMonery) {
			return;
		}
		$el.css({	
			background: '-o-linear-gradient(left, #BEC3C7 '+ $step +'%, #F2F3F7 '+ $step +'%)',
			background: '-moz-linear-gradient(left, #BEC3C7 '+ $step +'%, #F2F3F7 '+ $step +'%)',
			background: '-webkit-gradient(linear, left top, right top, from(#BEC3C7), color-stop('+ $step +', #BEC3C7), color-stop('+ $step +', #F2F3F7), to(#F2F3F7))',
			background: '-webkit-linear-gradient(to right, #BEC3C7 '+ $step +'%, #F2F3F7 '+ $step +'%)',
			background: 'linear-gradient(to right, #BEC3C7 '+ $step +'%, #F2F3F7 '+ $step +'%)'
		});
	}

	_requires() {
		this.default = $.extend(this.default, this.data);
		this.render(tmpl, this.default, this.el);
	}

	_initAttrs() {
		this.rangeEl = $('.J_RangeValue', this.el);
		// this._setBgColor(this.data.placeholder);
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
				isOpp: false, // 是否类似(-100% - 0)
				isSignBefore: true, // 符号是在前还是后 默认前
				sign: '$'
			}
		}
	}
}

module.exports = SetRange;