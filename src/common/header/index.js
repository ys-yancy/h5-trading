
"use strict";

var Base = require('../../app/es6-base');
var Util = require('../../app/util');

class Header extends Base {
	constructor() {
		super();
		this.el = $('#J_Header_Out');
		this._init();
	}

	_init() {
		// 有from参数 (表示来自于另一个H5页面 或者 微信转发), 就显示头部, 如果有 from=iosapp 或 from=androidApp则不显示头部
		if (window.location.search.indexOf('from=') != -1 && (window.location.search.indexOf('from=iosapp') == -1 || window.location.search.indexOf('from=androidApp') == -1)) {
			this.el.show();
		}
	
		// 如果search里有header=true, 就显示头部
		if (window.location.search.indexOf('header=true') != -1) {
			this.el.show();
		}

		// 有from参数, 但不是http开头的链接, 那就不需要返回按钮
		if (window.location.search.indexOf('from=http') != -1 || window.location.search.indexOf('from=file') != -1) {

		}
		else {
			$('.go-back').hide();
		}

		
		// 如果不在微信里, 就显示头部
		if (!Util.isWeixin()) {
			this.el.show();
		}
		
	}

	show() {
		this.el.show();
	}
}

module.exports = Header;