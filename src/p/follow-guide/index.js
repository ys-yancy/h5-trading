"use strict";
require('../../common/slider');
var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var Config = require('../../app/config');
var Cookie = require('../../lib/cookie');
var Uri = require('../../app/uri');
var Sticky = require('../../common/sticky/');
var Toast = require('../../common/toast');
var TradeConut = require('./trade-count');
var TradeCurrent = require('./trade-current');
var TradeHistory = require('./trade-history');
var FollowAction = require('./follow-action');
var guide1tmpl = require('./guide-1.ejs');
var guide2tmpl = require('./guide-2.ejs');
// var tmpl = require('./index.ejs');

function FollowGuide() {
	FollowGuide.superclass.constructor.apply(this, arguments);
	this._component = {};
	$('#slider').slider({
        loop: false,
        play: false,
        interval: 10 * 1000,
        duration: 1000
    });
   
	this.expertId = 86;
	
	if ( Cookie.get('token') ) {
    	this._renderGuide1().then(() => {
			this.init();
		}, () => {
			console.log('error')
			this.init();
		})
	} else {
	    window.location = getLoginWL();
    }
    
    this._renderGuide2().then(() => {

    })
}

Base.extend(FollowGuide, PageBase, {
	init: function() {
		this._bind();
		// this._initAttrs();
		// this._initSticky();
		this._requires();
	},

	_bind: function() {
		var doc = $(document);

		doc.on('click', (e) => {
			var targetEl = $(e.toElement || e.relatedTarget || e.target);
			//&& !targetEl.hasClass('active')
			if (targetEl.parents('#J_SidebarInner').length > 0 && this.el) {
				this._close();
			}
		})

		
		doc.on('tap', '.J_Tab', $.proxy(this._switch, this));

		doc.on('click', '.J_Close', $.proxy(this._close, this));

		doc.on('click', '.J_Follow', $.proxy(this._showFollowAction, this));

		//更多设置
		doc.on('click', '.J_ReviseSetting', $.proxy(this._showFollowActionMore, this))
	},

	_switch: function(e) {
		var curEl = $(e.target),
			index = curEl.index(),
			contentEls = $('.J_ContentFollow'),
			curContentEl = $(contentEls[index]);

		if ( curEl.hasClass('active') ) {
			return;
		}

		curEl.siblings('.J_Tab').removeClass('active');
		contentEls.removeClass('active').hide();
		curContentEl.addClass('show').show();
		curEl.addClass('active');

	},

	_attentionAction: function(source) {
		var data = {
			access_token: Cookie.get('token')
		}
		return this.ajax({
			url: '/v1/follow/follower/expert/'+ this.expertId +'/'+ source +'/',
			data: data,
			type: 'POST',
			hideError: true
		}).then((data) => {
			return data;
		})
	},
	_submitAttention: function() {
		this._attentionAction('follow').then((data) => {
			if (data.status == 200) {
				var attentionEl = $('.J_Attention', this.el);
				new Toast('关注成功');
				this._toggleBtn(attentionEl, '.J_CancelAttention');
			}
		})
	},

	_cancelAttention: function() {
		this._attentionAction('unfollow').then((data) => {
			if (data.status == 200) {
				var cancelAttention = $('.J_CancelAttention', this.el);
				new Toast('取消成功');
				this._toggleBtn(cancelAttention, '.J_Attention');
			}
		})
	},

	_reFollow: function() {
		this._request('enable').then((data) => {
			var reFollowEl = $('.J_ReFollow', this.el),
				isPause = this.exportData.follow_paused == 1;
			app.success('启用成功', 1500);
			this._toggleBtn(reFollowEl, '.J_CancelFollow');

			if ( isPause ) {
				$('.J_KeepFollow', this.el).removeClass('hidden')
			} else {
				$('.J_PauseFollow', this.el).removeClass('hidden')
			}
		})
	},

	_cancelFollow: function() {
		new Dialog().on('confirm', () => {
			this._request('cancel').then((data) => {
				var reFollowEl = $('.J_CancelFollow', this.el);
				this._toggleBtn(reFollowEl, '.J_ReFollow');
				// this.referEl.removeClass('follow').addClass('unfollow');
				// app.success('您已取消跟单', 1500);
			})
		})
	},

	_keepFollow: function() {
		this._request('unpause').then((data) => {
			var keepFollowEl = $('.J_KeepFollow', this.el);
			app.success('您已恢复跟随', 1500);
			this._toggleBtn(keepFollowEl, '.J_PauseFollow');
		})
	},

	_pauseFollow: function() {
		this._request('pause').then((data) => {
			var pauseFollowEl = $('.J_PauseFollow', this.el);
			app.success('您已暂停跟单', 1500);
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
		this._showFollowLoading('设置跟随资金');

		new FollowAction({
			parent: this,
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
		this._showFollowLoading('跟单参数配置');

		new FollowAction({
			parent: this,
			id: this.expertId,
			isMore: true
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
      
    _renderGuide1: function() {
        return this.ajax({
            url: '/v1/follow/rank/expert/profit/yield_rate/',
            data: {
                access_token: this.cookie.get('token')
            }
        }).then((data) => {
            data = data.data;
            data.length = 2;
            this.render(guide1tmpl, data, $('.J_Guide1Wraper'));
        })
    },

    _renderGuide2: function() {
		var data = {
			access_token: Cookie.get('token'),
			expert_id: this.expertId
		}

		return this.ajax({
			url: '/v1/follow/rank/expert/'+ this.expertId +'/summary/',
			data: data
		}).then((data) => {
			data = data.data[0];

			data.img = data.img ? Config.getAvatarPrefix(data.img) : getDefaultIconWL();
			data.accountType = Cookie.get('type');
			this.exportData = data;
			this.el = this.render(guide2tmpl, data, $('.J_Guide2Wraper'));
		})
	},

	_render: function() {
		var data = {
			access_token: Cookie.get('token'),
			expert_id: this.expertId
		}

		return this.ajax({
			url: '/v1/follow/rank/expert/'+ this.expertId +'/summary/',
			data: data
		}).then((data) => {
			data = data.data[0];

			data.img = data.img ? Config.getAvatarPrefix(data.img) : getDefaultIconWL();
			data.accountType = Cookie.get('type');
			this.exportData = data;
			this.el = this.renderTo(tmpl, data, $('#J_Content'));
		})
	},

	_showFollowLoading: function(title) {
		$('#J_FollowTl').text(title);
		this.followLoadingEl.show();
	},

	_hideFollowLoading: function(title) {
		this.followLoadingEl.hide();
		$('#J_FollowTl').text(title);
	},

	_requires: function() {
		this._component = {
			TradeCurrent: new TradeCurrent({
				el: $('#J_TradeCurrent'),
				id: this.expertId
			}),

			TradeHistory: new TradeHistory({
				el: $('#J_TradeHistory'),
				id: this.expertId
			}),

			TradeConut: new TradeConut({
				el: $('#J_TradeCount'),
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
		followLoadingEl: $('#J_FollowLoading')
	}
})

new FollowGuide();