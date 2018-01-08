/**
 * 跟单
 */

"use strict";
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
var tmpl = require('./index.ejs');

function FollowOrder() {
	FollowOrder.superclass.constructor.apply(this, arguments);
	this._component = {};
	
	this.expertId = new Uri().getParam('expertId');
	
	if ( Cookie.get('token') ) {
    	this._render().then(() => {
			// if (!this.cookie.get('token')) {
			// 	$('.footer').replaceWith('<a>马上注册,就可以开始跟单了!</a>');
			// }
			this.init();
		}, () => {
			console.log('error')
			this.init();
		})
	} else {
	    window.location = getLoginWL();
	}
}

Base.extend(FollowOrder, PageBase, {
	init: function() {
		this._bind();
		this._initAttrs();
		this._initSticky();
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

		
		this.el.on('click', '.J_Tab', $.proxy(this._switch, this));

		this.el.on('click', '.J_Close', $.proxy(this._close, this));

		this.el.on('click', '.J_Follow', $.proxy(this._showFollowAction, this));

		//更多设置
		this.el.on('click', '.J_ReviseSetting', $.proxy(this._showFollowActionMore, this))

		// 关注榜单
		this.el.on('click', '.J_Attention', $.proxy(this._submitAttention, this));
		this.el.on('click', '.J_CancelAttention', $.proxy(this._cancelAttention, this));

		// //暂停跟随
		// this.el.on('click', '.J_PauseFollow', $.proxy(this._pauseFollow, this));
		// //继续跟随
		// this.el.on('click', '.J_KeepFollow', $.proxy(this._keepFollow, this));
		// //取消跟随
		// this.el.on('click', '.J_CancelFollow', $.proxy(this._cancelFollow, this));
		// // 启用跟随
		// this.el.on('click', '.J_ReFollow',  $.proxy(this._reFollow, this))\
		
		doc.on('tap', '.share', function() {
            $('#J_ShareImg').show();
        });

        doc.on('tap', '#J_ShareImg', $.proxy(function() {
            $('#J_ShareImg').hide();
        }, this));
		
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

			this._share();

		})
	},

	_share: function() {
		var self = this;
		this.getAccount().then(function(account) {
        if (! self.profileObject) {
          self.profileObject = new Object();
        }

        self.profileObject.avatar = account.avatar ? Config.getAvatarPrefix(account.avatar) : '';
        self.profileObject.nickname = account.nickname;
		self.profileObject.expertId = self.expertId;
		
        if (self.isWeixin()) {
          	var share,
				desc = '分享',
				html = '<span class="followOrder share ui icon"></span>';
        
			// $('#J_Header').append(html);

			self.setupWeiXinShare('superior');
			  
        }else if (Config.isAndroidAPK()) {

          	var avatar = self.profileObject.avatar;
          	if (avatar && avatar.indexOf('http') == -1) {
				// console.log(document.location.protocol)
            	avatar = "http:" + avatar;
          	}
          	var nick = self.profileObject.nickname;
          
          	var title = '我是高手';//分享标题;
          	var desc = getWXHistoricalDesWL(); //'点击查看详情'; 
          	var imgUrl = self.profileObject.avatar || getWXIconWL(); 
          	var wl = Cookie.get('wl'),
          		wl_url = '/s/master-order.html?expertId=';

          	if ( wl != 'firstbroker' ) {
              	wl_url = '/' + wl + '/s/master-order.html?expertId=';
          	}

          	var link = Config.getAndroidSharePrefix() + wl_url + self.profileObject.expertId; // 分享链接

          	var l = 'invhero-android:shareOrder?title=' + encodeURIComponent(title) + '&desc=' + encodeURIComponent(desc) + '&imgUrl=' + encodeURIComponent(imgUrl) + '&link=' + encodeURIComponent(link);

          	// 添加分享按钮
          	var html = '<a class="option share ui icon" href=' + l + '></a>';
          	$('#J_Header').append(html);
        }
      });
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
				el: $('#J_TradeCurrent', this.el),
				id: this.expertId
			}),

			TradeHistory: new TradeHistory({
				el: $('#J_TradeHistory', this.el),
				id: this.expertId
			}),

			TradeConut: new TradeConut({
				el: $('#J_TradeCount', this.el),
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

new FollowOrder();