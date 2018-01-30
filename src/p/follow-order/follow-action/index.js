/**
 * 跟单操作的具体流程
 */

"use strict";
require('./index.css');
var PageBase = require('../../../app/page-base');
var Cookie = require('../../../lib/cookie');
var SetRange = require('../../../common/set-range');
var Toast = require('../../../common/toast');
var tmpl = require('./index.ejs.html');
var moreSettingTmpl = require('./moreSetting.ejs.html');

class FollowAction extends PageBase {
	constructor(config) {
		super(config);


		this.getAccount().then((data) => {
			var type = 'real';//Cookie.get('type');
			this.account = data.account[type];
			this._render().then(() => {
				this._init();
			}, ()=> {
				this._init();
			})
		})
	}

	_init() {
		this._bind();
		this._showMoreSetting();
	}

	_bind() {
		this.el.on('click', '.J_CloseFollow', $.proxy(this._closeFollowDialog, this));
		this.el.on('click', '.J_MoreSetting', $.proxy(this._showMoreSetting, this));

		this.el.on('click', '.J_Radio', $.proxy(this._radioAction, this));

		this.el.on('click', '.J_StartFollow', $.proxy(this._action, this));

		this.el.on('click', '.J_FollowSettingSubmit', $.proxy(this._SubmitFollow, this));

		if ( false ) {
			this.el.on('click', '.J_FollowRecharge', (e) => {
				e.preventDefault(); 
				e.stopPropagation();
				new Toast('仅供演示使用！')
			});
		}
	}

	_initMoreSettingCapitalRange() {
		var config = this._getRangeConf();
		this.follow_amount = config.followAmount;
		this.moreSettingCapitalRange = new SetRange({
			el: $('.J_CapitalRange', this.el),
			data: {
				placeholder: config.followAmount,
				max: config.freeMargin, 
				min: config.min,
				step: 5,
				isNoMonery: config.isNoMonery,
				minMonery: config.minMonery
			}
		}).on('setRangeSuccess', (value) => {
			this.follow_amount = value;
		})
	}

	_initMoreSettingRiskRange() {
		var placeholder = 50;
		if (this.config_follow_action.risk_ratio) {
			placeholder = this.config_follow_action.risk_ratio * 100;
		}
		this.risk_ratio = placeholder / 100;
		this.moreSettingRiskRange = new SetRange({
			el: $('.J_RiskRange', this.el),
			data: {
				placeholder: placeholder,
				max: 100, 
				min: 0,
				step: 1,
				isOpp: true,
				isSignBefore: false,
				sign: '%'
			}
		}).on('setRangeSuccess', (value) => {
			this.risk_ratio = value / 100;
		})
	}

	_showMoreSetting() {
		// 这里应该有一个异步
		this.render(moreSettingTmpl, this.config_follow_action, this.el);
		this._initMoreSettingCapitalRange();
		this._initMoreSettingRiskRange();
	}

	_closeFollowDialog() {
		this.el && this.el.off('click');
		this.el && this.el.remove();
	}

	_radioAction(e) {
		var curEl = $(e.currentTarget);
		var parentEl = curEl.parents('.set-wrapper');
		var valRatioEl = $('.J_ValRatio', this.el);
		var radios = $('.J_Radio', this.el);


		if (parentEl.index() !== 0) {
			valRatioEl && valRatioEl.prop('disabled', false);
		} else {
			valRatioEl && valRatioEl.prop('disabled', true);
		}
		
		if ( curEl.hasClass('active') ) {
			curEl.removeClass('active').addClass('off');
			parentEl.siblings('.J_FollowMode').removeClass('active');
			parentEl.removeClass('active');
			return;
		}

		radios.removeClass('active').addClass('off');
		curEl.addClass('active').removeClass('off');
		parentEl.siblings('.J_FollowMode').removeClass('active');
		parentEl.addClass('active');
		
	}

	_action() {
		// 默认 实盘  按资金下单
		var params = null;
		params = {
			access_token: Cookie.get('token'),
			follow_amount: this.follow_amount,
			follow_mode: 'follow_amount_ratio',
			account_type: 'real',
			enable: 1
		}

		this._updateFollowConfig(params).then((data) => {
			if ( data.status == 200 ) {
				this._enableFollow().then(() => {
					this._closeFollowDialog();
					new Toast('跟单成功');
					this.fire('follow:order:success');
				})
				// this._closeFollowDialog();
				// app.success('跟单成功', 1500);
			}
		})
	}

	_SubmitFollow() {
		var data = {
			access_token: Cookie.get('token'),
			enable: 1 // 默认启用
		}
		var params = this._getParams();

		params = $.extend(params, data);

		this._updateFollowConfig(params).then((data) => {
			if (data.status == 200) {
				this._enableFollow().then(() => {
					this._closeFollowDialog();
					new Toast('修改成功');
					this.fire('follow:order:success');
				})
				// this._closeFollowDialog();
				// app.success('修改成功', 1500);
			}
		})
		
	}

	_updateFollowConfig(params) {
		this.config_follow_action = $.extend(this.config_follow_action, params);
		return this.ajax({
			url: '/v1/follow/follower/expert/'+ this.id +'/config/',
			data: params,
			type: 'POST',
			noToast: true
		}).then((data) => {
			this.broadcast('update:gendan:list');
			return data
		}, (data) => {
			new Toast(data.message);
		})
	}

	_enableFollow() {
		var data = {
			access_token: Cookie.get('token')
		}
		return this.ajax({
			url: '/v1/follow/follower/expert/'+ this.id +'/enable/',
			data: data,
			type: 'POST'
		}).then((data) => {
			return data
		})
	}

	_getAccount() {
		var type = Cookie.get('type')
    	var acconut = app.proxy('account', 'getValue');
    	return acconut[type];
	}

	_getParams() {
		var followModeEl = $('.J_FollowMode.active', this.el);
		var volRatioEl = $('.J_ValRatio', this.el);
		var slippageEl = $('.J_Slippage', this.el);
		var reverseEl = $('.J_Reverse:checked', this.el);
		var accountTypeEl = $('.J_AccountType:checked', this.el);
		var openOrderWeixinEl = $('.J_OpenOrderWeixin:checked', this.el);
		var closeOrderWeixinEl = $('.J_CloseOrderWeixin:checked', this.el);
		var index = followModeEl.index();
		var followMode,  setParams = null;

		setParams =  {
			account_type: accountTypeEl.val() || 'real', // 账户类型
			risk_ratio: this.risk_ratio, // 风险比例
			slippage: slippageEl.val(), // 滑点控制
			reverse: reverseEl.val(), // 跟单方向
			open_order_weixin_notify: openOrderWeixinEl.length > 0 ? 1 : 0,
			close_order_weixin_notify: closeOrderWeixinEl.length > 0 ? 1 : 0
		}

		if (index === 1) {
			followMode = 'fix_volume_ratio';
			setParams.vol_ratio = volRatioEl.val(); // 固定倍数
		} else {
			followMode = 'follow_amount_ratio';
			setParams.follow_amount = this.follow_amount; // 跟单金额
		}
		setParams.follow_mode = followMode; // 用哪种方式跟单
		return setParams;

	}

	_getRangeConf() {
		return {
			followAmount: this.followAmount,
			freeMargin: this.config_follow_action.freeMargin,
			min: this.config_follow_action.min,
			isNoMonery: this.config_follow_action.isNoMonery,
			minMonery: this.config_follow_action.minMonery
		}
	}

	_render() {
		return this.ajax({
			url: '/v1/follow/follower/expert/'+ this.id +'/config/?access_token=' + Cookie.get('token'),
			noToast: true
		}).then((data) => {
			data = data.data;
			data = this._updateDefaultConfig(data);
			data.slippage = data.slippage ? data.slippage : 5;
			this.el = this.renderTo(tmpl, data, $('body'));
			this.parent._hideFollowLoading();
		}, (err) => {
			var errorCode = err.status;
			if (errorCode === 400) {
				
				var defaultConfig = this._updateDefaultConfig();
				this.el = this.renderTo(tmpl, defaultConfig, $('body'));
				this.parent._hideFollowLoading();
			}
		})
	}

	_updateDefaultConfig(defaultCon) {

		var freeMargin = parseInt(this.account.free_margin);
		var defaultConfig =  {
			account_type: 'real', // 账户类型
			risk_ratio: 0.5, // 风险比例
			slippage: 5, // 滑点控制
			reverse: 0, // 跟单方向
			follow_mode: 'follow_amount_ratio',
			follow_amount: this.follower_balance_threshold || parseInt(freeMargin / 10),
			open_order_weixin_notify: 1,
			close_order_weixin_notify: 1
		}
		// defaultCon = defaultCon ? defaultCon : defaultConfig;
		defaultCon = $.extend(defaultConfig, defaultCon || {});
		
		if (this.follower_balance_threshold > freeMargin) {
			defaultCon.isNoMonery = true;
			defaultCon.minMonery = parseInt(this.follower_balance_threshold - freeMargin);
		} else {
			defaultCon.isNoMonery = false;
			defaultCon.minMonery = 0;
		}

		defaultCon.freeMargin = freeMargin;
	    defaultCon.min = this.follower_balance_threshold;
		this.config_follow_action = defaultCon;
		this.followAmount = defaultCon.follow_amount;

		return defaultCon;
	}

	_initAttrs() {
		
	}
}

module.exports = FollowAction;