"use strict";

import PageBase from '../../app/page-base';
// import loadLangJs from '../../app/load-lang';
import BottomNav from '../../common/bottom-nav';
import SildeMenu from '../../common/slide-menu';
import RemindMe from '../../common/remind-me';
import CheckOpenAccount from '../../common/check-open-account';
import Cookie from '../../lib/cookie';
import Banner from './banner';
import html from './html.ejs';
// import CheckFollowGuide from '../../common/check-follow-guide';
// import Guide from './guide';

class Home extends PageBase {
	constructor(config) {
		super(config);
		this.getAllSymbolsPrice().then(() => {
			this._init();
		});
		new CheckOpenAccount();
		// new CheckFollowGuide();
		new BottomNav({
			page: 'home'
		});

		// var new_home_guide = Cookie.get('new_home_guide');
		// if (!new_home_guide || (new_home_guide && new_home_guide != 1)) {
		// 	this.guide = new Guide();
		// }

	}

	_init() {
		this._bind();
		this._getData();
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

	_getData() {
		this.ajax({
			url: '/v1/user/home/data/',
			data: {
				access_token: Cookie.get('token')
			}
		}).then((data) => {
			data = data.data;
			this._update(data);
		})
	}

	_update(data) {
		this._updateCommision(data.invite_data);
		this._updateFollow(data.mobtrade_data);
		this._updatAutoTrade(data.auto_data)
	}

	_updateCommision(data) {
		var ownCommisionEl = $('.J_OwnCommision', '#comsion-content'),
			ownInviteNumEl = $('.J_OwnInviteNum', '#comsion-content'),
			maxCommisionEl = $('.J_MaxCommision', '#comsion-content'),
			maxUserNameEl = $('.J_MaxUserName', '#comsion-content');
		
			ownCommisionEl.text(data.mark_up_sum);
			ownInviteNumEl.text(data.invite_num);
			maxCommisionEl.text(data.max_markup);
			maxUserNameEl.text(data.max_name);
	}

	_updateFollow(data) {
		var containerEl = $('#J_Master');
		if (getBottomNavPages().indexOf('master') === -1) {
			containerEl.remove();
			return;
		}

		containerEl.show();
		var followProfitEl = $('.J_FollowProfit', '#follow-content'),
			followTicketCountEl = $('.J_FollowTicketCount', '#follow-content'),
			maxFollowProfitEl = $('.J_MaxFollowProfit', '#follow-content'),
			maxFollowNameEl = $('.J_MaxFollowName', '#follow-content');

		followProfitEl.text(data.order_profits);
		followTicketCountEl.text(data.order_count);
		maxFollowProfitEl.text(data.max_profits);
		maxFollowNameEl.text(data.name);
	}

	_updatAutoTrade(data) {
		var autoTradeProfitEl = $('.J_AutoTradeProfit', '#oneself-content'),
			autoTradeCountEl = $('.J_AutoTradeCount', '#oneself-content'),
			maxAutoProfitEl = $('.J_MaxAutoProfit', '#oneself-content'),
			maxAutoCountEl = $('.J_MaxAutoCount', '#oneself-content');

		autoTradeProfitEl.text(data.order_profits);
		autoTradeCountEl.text(data.order_count);
		maxAutoProfitEl.text(data.max_profits);
		maxAutoCountEl.text(data.name);
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
		new RemindMe();
		new SildeMenu({
			el: $('#J_SlideMenu'),
			page: 'home'
		})
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
/**
 * 先加载语言再初始化实例
 * 为之后多语言做准备
 */
// loadLangJs.initAppLang(html).then((data) => {
// 	new Home();
// })
