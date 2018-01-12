"use strict";

import Base from '../../app/base';
// import BottomNav from '../../common/bottom-nav';
import SildeMenu from '../../common/slide-menu';
import FloatMsg from '../../common/float-msg';
import Cookie from '../../lib/cookie';
import Banner from './banner';

class Home extends Base {
	constructor(config) {
		super(config);
		this._init();
	}

	_init() {
		this._getData();
		this._requires();
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

	_requires() {
		new Banner();
		new FloatMsg();
		new SildeMenu({
			el: $('#J_SlideMenu'),
			page: 'home'
		})
	}
}

new Home();