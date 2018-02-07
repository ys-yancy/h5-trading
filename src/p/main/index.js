"use strict";

import PageBase from '../../app/page-base';
import BottomNav from '../../common/bottom-nav';
import SildeMenu from '../../common/slide-menu';
import RemindMe from '../../common/remind-me';
import TopMsg from '../../common/top-msg';
import CheckOpenAccount from '../../common/check-open-account';
// import CheckFollowGuide from '../../common/check-follow-guide';
// import Marquee from '../../common/marquee';
// import Guide from './guide';
import Cookie from '../../lib/cookie';
import Banner from './banner';
import Nav from './nav';
import HotSymbols from './hot-symbols';
import MainMasters from './masters';

class Home extends PageBase {
	constructor(config) {
		super(config);
		
		this.getAllSymbolsPrice().then(() => {
			this._init();
		});

		// var new_home_guide = Cookie.get('new_home_guide');
		// if (!new_home_guide || (new_home_guide && new_home_guide != 1)) {
		// 	this.guide = new Guide();
		// }
	}

	_init() {
		this._bind();
		this._requires();
		this._timeHandler(true);
	}

	_bind() {
		var RAF = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
			function(c) {
				setTimeout(c, 1 / 60 * 1000);
			};

		var CAF = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.clearTimeout;

		$(document).on('scroll', () => {
			RAF(this._timeHandler.bind(this));
		});
	}

	_scrollHeader() {
	}

	_timeHandler(isLast) {
		clearTimeout(this.timer);

		var winScrollTop = this.win.scrollTop();

		if (winScrollTop > this.headerHeight) {
			this.headerEl.addClass('ui');
			this.titleEl.css({
				'background': 'transparent',
				'opacity': '1'
			});
		} else {
			this.opacity = parseInt(winScrollTop / 10) / 10;
			this.headerEl.removeClass('ui');
			this.titleEl.css({
				'background': this.titleElBackground,
				'opacity': this.opacity
			});
		}
		
		var typeStr = typeof isLast;
		if (typeStr == 'boolean' && typeStr != 'number') {
			return;
		}

		this.timer = setTimeout(() => {
			this._timeReduce();
		}, 1000);
	}

	_timeReduce() {
		this._timeHandler(true);
	}

	_requires() {
		new Banner();
		// new RemindMe();
		new SildeMenu({
			el: $('#J_SlideMenu'),
			page: 'home'
        });
        
        new CheckOpenAccount();
		// new CheckFollowGuide();
		new BottomNav({
			page: 'home'
        });

        new Nav({
            el: $('.main-nav')
		});

		var topmsg = new TopMsg({
	        el: $('.top-message'),
	        tags: 'home'
		}, 10 * 1000);
		
		new HotSymbols({
			el: $('.main-symbols')
		});

		new MainMasters({
			el: $('.main-master')
		});
        
	}

	defaults() {
		return {
			win: $(window),
			headerEl: $('.header-inner'),
			titleEl: $('.J_Title'),
			titleElBackground: $('.J_Title').css('backgroundColor'),
			headerHeight: 100,//$('header').height(),
			opcity: 0
		}
	}
}

new Home();