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
		this._requires();
		this._initSticky();
	},

	_bind: function() {
		var doc = $(document);
		//更多设置
		this.el.on('click', '.J_ReviseSetting', $.proxy(this._showFollowActionMore, this))

		// 启用跟随
		this.el.on('click', '.J_ReFollow',  $.proxy(this._reFollow, this))
		
	},

	_reFollow: function(e) {
		var curEl = $(e.currentTarget);
		this._showLoad(curEl);

		this._request('enable').then((data) => {
			var reFollowEl = $('.J_ReFollow', this.el),
				isPause = this.exportData.follow_paused == 1;
			new Toast('启用成功');
            this._hideLoad();
            
            setTimeout(() => {
                location.href = './followlist.html';
            }, 1500)
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

	_showFollowActionMore: function() {
		this._showFollowLoading('跟单参数配置');
		new FollowAction({
			parent: this,
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

	_showLoad: function(curEl) {
		this.loadEl = curEl;
		curEl.append('<div class="loading-wrapper"><span>处理中<span class="dialog-load"></span></span></div>')
	},
	
	_hideLoad: function() {
		$('.loading-wrapper', this.loadEl).remove();
	},
	  
	_showFollowLoading: function(title) {
		$('#J_FollowTl').text(title);
		this.followLoadingEl.show();
	},

	_hideFollowLoading: function(title) {
		this.followLoadingEl.hide();
		$('#J_FollowTl').text(title);
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
			TradeHistory: new TradeHistory({
				el: $('#J_TradeHistory', this.el),
				id: this.expertId
			})
		}
	},

	_initSticky: function() {
		$('nav').sticky();
	},

	attrs: {
		wrapEl: $('#J_FollowOrder'),
		hdEl: $('.hd', '#J_FollowOrder'),
		navEl: $('nav', '#J_FollowOrder'),
		bdEl: $('.bd', '#J_FollowOrder'),
		followLoadingEl: $('#J_FollowLoading')
	}
})

new FollowOrder();