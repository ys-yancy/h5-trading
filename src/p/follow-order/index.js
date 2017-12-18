/**
 * 跟单
 */

"use strict";
var Base = require('../../app/base');
var Config = require('../../app/config');
var Cookie = require('../../lib/cookie');
var Uri = require('../../app/uri');
var Sticky = require('../../common/sticky/');
var Toast = require('../../common/toast');
var TradeCurrent = require('./trade-current');
var TradeHistory = require('./trade-history');
var FollowAction = require('./follow-action');
// var Dialog = require('./dialog');
var Dialog = require('../../common/dialog');
var tmpl = require('./index.ejs');

function FollowOrder() {
	FollowOrder.superclass.constructor.apply(this, arguments);
	this._component = {};
	
	this.expertId = new Uri().getParam('expertId');
	
	if ( Cookie.get('token') ) {
    	this._render().then(() => {
			this.init();
		}, () => {
			console.log('error')
			this.init();
		})
	} else {
	    window.location = getLoginWL();
	}
	
}

Base.extend(FollowOrder, Base, {
	init: function() {
		this._bind();
		this._initAttrs();
		this._initSticky();
		this._requires();
	},

	_bind: function() {
		var doc = $(document);
		
		this.el.on('click', '.J_Tab', $.proxy(this._switch, this));

		this.el.on('click', '.J_Close', $.proxy(this._close, this));

		this.el.on('click', '.J_Follow', $.proxy(this._showFollowAction, this));

		//更多设置
		this.el.on('click', '.J_ReviseSetting', $.proxy(this._showFollowActionMore, this))

		//暂停跟随
		this.el.on('click', '.J_PauseFollow', $.proxy(this._pauseFollow, this));
		//继续跟随
		this.el.on('click', '.J_KeepFollow', $.proxy(this._keepFollow, this));
		//取消跟随
		this.el.on('click', '.J_CancelFollow', $.proxy(this._cancelFollow, this));
		// 启用跟随
		this.el.on('click', '.J_ReFollow',  $.proxy(this._reFollow, this))
		
	},

	_switch: function(e) {
		var curEl = $(e.target),
			index = curEl.index(),
			contentEls = $('.J_ContentFollow', this.el),
			curContentEl = $(contentEls[index]);

		if ( curEl.hasClass('active') ) {
			return;
		}

		curEl.siblings('.J_Tab').removeClass('active');
		contentEls.removeClass('active').hide();
		curContentEl.addClass('show').show();
		curEl.addClass('active');

	},

	_reFollow: function() {
		this._request('enable').then((data) => {
			var reFollowEl = $('.J_ReFollow', this.el),
				isPause = this.exportData.follow_paused == 1;
			new Toast('启用成功');
			this._toggleBtn(reFollowEl, '.J_CancelFollow');
			// this.referEl.removeClass('unfollow').addClass('follow');

			if ( isPause ) {
				$('.J_KeepFollow', this.el).removeClass('hidden')
			} else {
				$('.J_PauseFollow', this.el).removeClass('hidden')
			}
		})
	},

	_cancelFollow: function() {
	    this.dialog = new Dialog({
		    isShow: true,
		    tmpl: this.tmpl,
		    cancleCallback: $.proxy(function() {
		      	this._request('cancel').then((data) => {
					var reFollowEl = $('.J_CancelFollow', this.el);
					this._toggleBtn(reFollowEl, '.J_ReFollow');
					// this.referEl.removeClass('follow').addClass('unfollow');
					// app.success('您已取消跟单', 1500);
				})
			}, this)
	    })
	},

	_keepFollow: function() {
		this._request('unpause').then((data) => {
			var keepFollowEl = $('.J_KeepFollow', this.el);
			new Toast('您已恢复跟随');
			this._toggleBtn(keepFollowEl, '.J_PauseFollow');
		})
	},

	_pauseFollow: function() {
		this._request('pause').then((data) => {
			var pauseFollowEl = $('.J_PauseFollow', this.el);
			new Toast('您已暂停跟单');
			this._toggleBtn(pauseFollowEl, '.J_KeepFollow');
		})
	},

	_request: function(source) {
		var data = {
			access_token: Cookie.get('token')
		}
		return this.ajax({
			url: '/v1/follow/follower/expert/'+ this.expertId +'/'+ source +'/',
			data: data,
			type: 'POST'
		}).then((data) => {
			return data
		})
	},

	_showFollowAction: function() {
		new FollowAction({
			id: this.expertId,
			follower_balance_threshold: this.exportData.follower_balance_threshold
		}).on('follow:order:success', () => {
			var isPause = this.exportData.follow_paused == 1;
			var startEl = $('.J_Follow', this.el);
			startEl.addClass('hidden');
			if (isPause) {
				startEl.siblings('.J_Pauseing').removeClass('hidden');
			} else {
				startEl.siblings('.J_Following').removeClass('hidden');
			}
		})
	},

	_showFollowActionMore: function() {
		new FollowAction({
			id: this.expertId,
			follower_balance_threshold: this.exportData.follower_balance_threshold,
			isMore: true
		}).on('follow:order:success', () => {
			var isPause = this.exportData.follow_paused == 1;
			$('.J_CancelFollow').removeClass('hidden');
			$('.J_ReFollow').addClass('hidden');
			if (isPause) {
				$('.J_KeepFollow').removeClass('hidden');
			} else {
				$('.J_PauseFollow').removeClass('hidden');
			}
		})
	},

	_toggleBtn: function(curBtnEl, nextClass) {
		curBtnEl.addClass('hidden');
		curBtnEl.siblings(nextClass).removeClass('hidden');
	},

  	_close: function() {
  		console.log('close');

  		this.destroy();
  	},

  	_destroycomponent: function() {
  		Object.keys(this._component).forEach((componentKey, index) => {
  			this._component[componentKey].fire('destroy');
  		})
  	},

  	destroy: function() {
  		this.el && this.el.off('click');
  		this.el && this.el.hide().remove();
  		this.placeholdEl && this.placeholdEl.remove();
  		this._destroycomponent();
  		this.fire('destroy');
  		this.off('refresh');
  		this.off('destroy');
  		this.el = null;
  	},

	_render: function() {
		var data = {
			access_token: Cookie.get('token'),
			expert_id: this.expertId
		}

		return this.ajax({
			url: '/v1/follow/follower/expert/'+ this.expertId +'/summary/',
			data: data
		}).then((data) => {
			data = data.data;

			data.img = data.img ? Config.getAvatarPrefix(data.img) : getDefaultIconWL();

			data.accountType = Cookie.get('type');

			this.exportData = data;
			this.el = this.renderTo(tmpl, data, $('#J_Content'));
		})
	},

	_requires: function() {
		this._component = {
			TradeCurrent: new TradeCurrent({
				el: $('#J_TradeCurrent', this.el),
				id: this.expertId
			}),

			TradeHistory: new TradeHistory({
				el: $('#J_TradeHistory', this.el),
				id: this.expertId
			})
		}
	},

	_initSticky: function() {
		$('nav').sticky();
	},

	_initAttrs: function() {
		this.wrapEl = $('#J_FollowOrder');
		this.hdEl = $('.hd', '#J_FollowOrder');
		this.navEl = $('nav', '#J_FollowOrder');
		this.bdEl = $('.bd', '#J_FollowOrder');
	},

	attrs: {
		tmpl: ['<div class="dialog-ios8 J_Dialog" id="J_Dialog">',
	        '   <div class="dialog-title-ios8">重要提示</div>',
	        '   <div class="dialog-content-ios8 J_Content">取消跟随后，当前交易中的订单不再跟随高手信号平仓！！</div>',
	        '   <div class="dialog-buttons-ios8">',
	        '       <span class="dialog-btn J_DialogClose" data-idx="alert0">我知道了</span>',
	        '   </div>',
	        '</div>',
	        '<div class="dialog-mask J_DialogMask"></div>'
	    ].join(''),
	}
})

new FollowOrder();