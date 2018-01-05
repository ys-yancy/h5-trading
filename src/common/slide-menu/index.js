"use strict";
import './index.css';
import Config from '../../app/config';
import PageBase from '../../app/page-base';
import Util from '../../app/util.js';
import BottomAccount from '../bottom-account';
import RedeemCode from './component/redeem-code';
import UsQrCode from './component/qr-code';
import Dialog from '../dialog';
import tmpl from './index.ejs';
export default class SlideMenu extends PageBase {
	constructor(config) {
		super(config);
		this._render().then(() => {
			this._init();
		});
	}

	_init() {
		this._bind();
		this._requires();
		this._checkOnly();
		this._updateUserInfo();
	}

	_bind() {
		this.subscribe('get:realToken', this._getRealToken, this);

		this.el.on('tap', '.J_SwitchAccount', $.proxy(this._switchAccount, this))
		this.el.on('tap', '.J_SwitchTradeingUI', $.proxy(this._switchTradeingUI, this));

		$('.J_ShowSlideMenu').on('tap', $.proxy(this._showSlideMenu, this));
		$('#J_SlideMenuMask').on('tap', $.proxy(this._hideSlideMenu, this));
		$('#J_SlideMenuMask').on('touchmove', this._preventMove);
        // $('#J_UserDetails').on('touchmove', this._preventMove)
	}

	_switchAccount(e) {
		let curEl = $(e.currentTarget);
		let clEl = $('.J_Standard', curEl);

		if (clEl.hasClass('demo')) {
			// 换实盘
			this.cookie.set('goType', 'real');

			this.getRealToken().then((realToken) => {
				this._switchAccountReal(clEl);
			}, () => {
				this._switchAccountReset(clEl);
			})
		} else {
			this._switchAccountReset(clEl);
			this.bottomAccount._getAccount();
        	// this.broadcast('switch:account');
		}
	}

	_switchAccountReal(controEl) {
		this.cookie.set('type', 'real', {
          	expires: Infinity
        });
        this.bottomAccount._getAccount();
        // this.broadcast('switch:account');
		controEl.removeClass('demo').addClass('real');
	}

	_switchAccountReset(controEl) {
		let defaultType = getSimulatePlate() ? 'demo' : 'real';
		this.cookie.expire('goType');
		this.cookie.set('type', defaultType, {
          	expires: Infinity
        });
		controEl.removeClass('real').addClass('demo');
	}

	_switchTradeingUI(e) {
		let curEl = $(e.currentTarget);
		let clEl = $('.J_Standard', curEl);
		if (this.tradingUI == 4) {
			new Dialog({
				isShow: true,
				tmpl: `<div class="dialog dialog-standard dialog-logout" id="J_Dialog">
                   <span class="wrapper-icon"><span class="icon"></span></span>
                   <div class="dialog-content J_Content">
                       <p class="title">提示</p>
                       <div class="desc">已为您切换至极速交易限定品种请在【自选】页面查看</div>
                   </div>
                   <div class="dialog-buttons clearfix">
                       <span class="dialog-btn J_DialogClose close" id="J_DialogSetupCancel">我知道了</span>
                   </div>
                </div>
                <div class="dialog-mask J_DialogMask"></div>`,
			});
			this.tradingUI = 6;
      		clEl.addClass('off');
		} else {
			this.tradingUI = 4;
      		clEl.removeClass('off');
		}
		this.isChangeUI = true;
		this.cookie.set('tradingUI', this.tradingUI);
	}

	_hideNextAction() {
		//TODO: 这里暂时没有对isChangeType处理， 
		//因为_switchAccount可能会提前出发别的raload事件。
		
		let isChangeTdUI = this._isChangeTdUI(),
			isChangeType = this._isChangeType();

		if (isChangeTdUI || isChangeType) {
			// this.broadcast('switch:account:or:tradingui');
			window.location.reload();
		}
	}

	_showSlideMenu(e) {
		$('#J_SlideMenuMask').show();
		this.el.show();
		setTimeout(() => {
			$('body').addClass('show-slide-menu');
			this.el.addClass('unfold move-x');
		}, 0)
		
	}

	_hideSlideMenu() {
		this.el.removeClass('unfold move-x');
		setTimeout(() => {
			this.el.hide();
			$('#J_SlideMenuMask').hide();
			$('body').removeClass('show-slide-menu');
			this._hideNextAction();
		}, 450)
	}

	_preventMove(e) {
		e.preventDefault();
		return false;
	}

	_updateUserInfo() {
		this.getAccount().then(account => {
			let avatarEl = $('.J_UserAvatar', this.el),
				phoneEl = $('.J_UserPhone', this.el),
				nameEl = $('.J_UserName', this.el);
				
			let avatarUrl = Config.getAvatarPrefix(account.avatar);

			nameEl.text(account.nickname);
			phoneEl.text(account.phone);
			avatarEl.prop('src', avatarUrl);
			new UsQrCode({
				avatar: avatarUrl,
				name: account.nickname
			})
		})
	}

	_getRealToken() {
		var curEl = $('.J_Standard', '.J_SwitchAccount');
		curEl.removeClass('demo').addClass('real');
	}

	_isChangeTdUI() {
		return this.isChangeUI && this.initUI != this.tradingUI;
	}

	_isChangeType() {
		return this.initType != Cookie.get('type');
	}

	resetBottomAccount() {
		this.bottomAccount.destroy();
	    this.bottomAccount = new BottomAccount({checkOut: true, page: this.page, el: $('#J_BottomBanner')});//new BottomAccount({ checkOut: true });
	    this.bottomAccount.show();
	    this.bottomAccount.interval();
	}

	_checkOnly() {
		var isDemo = this.isDemo();
		if( Util.isWeixin() && getIsShowOptionWeinixnGuide() ) {
		    // new OptionWeixinGuide();
		    return;
		}

		if (Util.isWeixin() && !getWeiXinIsHasReal()) {
		    Cookie.set('type', 'demo');
		    return;
		} else if(getIsOnlyShowReal()){
		    Cookie.set('type', 'real');
		    return;
		}

		if (!getSimulatePlate() && !isDemo) {
			Cookie.expire('real_token');
	    	Cookie.set('type', 'demo');
	    	// window.location.reload();
	    }
	}

	_requires() {
		this.bottomAccount = new BottomAccount({checkOut: true, page: this.page, el: $('#J_BottomBanner')});
	    this.bottomAccount.show();
	    this.bottomAccount.interval();
	    this.fire('get:bottomAccount', this.bottomAccount);

	    new RedeemCode();
	}

	_render() {
		this.tradingUI = this.initUI;
		return new Promise((resolve, reject) => {
			this.render(tmpl, {
				type: this.initType,
				phone: Cookie.get('phone'),
				tradingUI: this.tradingUI,
				inviteCode: Cookie.get('inviteCode'),
				page: this.page,
				isSwtp: !getSimulatePlate() || getIsOnlyShowReal()
			}, this.el);
			resolve();
		})
	}

	defaults() {
		return {
			initUI: Cookie.get('tradingUI') || getDefaultTradingUI(),
			initType: Cookie.get('type'),
			isChangeUI: false,
			isChangeType: false
		}
	}
}