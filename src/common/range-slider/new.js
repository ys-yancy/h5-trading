"use strict";
require('./index.css');
var Base = require('../../app/base.js');
require('./range-slider.js');
class RangeSilder extends Base {
	constructor(config){
		super(config);
		this.init();
	}

	init() {
		this._createSlider();
	}

	_createSlider() {
		this.config = this.config || {};
		var config = $.extend(this.defaultCon, this.config);
		this.el.jRange(config);
		this.setVal(this.defaultVal);
	}

	setVal(val) {
		this.curVal = val;
		this.el.jRange('setValue', val)
	}

	updateRange(vals) {
		this.el.jRange('updateRange', vals)
	}

	getCurVal() {
		return this.curVal;
	}

	_setVal(val) {
		this.curVal = val;
		this.valEl && this.valEl.val(val);
	}

	defaults() {
		return {
			defaultCon: {
				from: 0,
				to: 100,
				step: 5,
				scale: [0, 100],
				showLabels: false,
				showScale: false,
				format: '%s',
				width: '100%',
				onstatechange: $.proxy(this._setVal, this)
			},
			valEl: ''	
		}
	}
}

module.exports = RangeSilder;