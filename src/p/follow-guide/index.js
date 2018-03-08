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
var guide4tmpl = require('./guide-4.ejs');

function FollowGuide() {
	FollowGuide.superclass.constructor.apply(this, arguments);
	if ( Cookie.get('token') ) {
		this._initSliderPage();
    	this._renderGuide1().then(() => {
			this.init();
		}, () => {
			console.log('error')
			this.init();
		})
	} else {
	    window.location = getLoginWL();
    }
}

Base.extend(FollowGuide, PageBase, {
	init: function() {
		this._bind();
		this._renderGuide4();
	},

	_bind: function() {
		var doc = $(document);
		doc.on('tap', '.J_Tab', $.proxy(this._switch, this));

		doc.on('click', '.J_Follow', $.proxy(this._showFollowAction, this));

		doc.on('tap', '.master-item', $.proxy((e) => {
			var curEl = $(e.currentTarget);
			this.expertId = curEl.attr('data-expertid');
			if (!isNaN(this.expertId)) {
				this._slideNextPage();
				this._renderGuide2();
			}

		}, this))

		doc.on('tap', '.footer-btn', () => {
			Cookie.set('new_follow_guide', 1);
		})
	},

	_slideNextPage: function() {
		var nextEl = $('.sel', '.km-slider-nav').next();
		if (nextEl.length > 0) {
			nextEl.trigger('tap');
		}
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

		if (curEl.hasClass('current') && !this._component.TradeCurrent) {
			this._component.TradeCurrent = new TradeCurrent({
				el: $('#J_TradeCurrent'),
				id: this.expertId
			});
		}

		if (curEl.hasClass('history') && !this._component.TradeHistory) {
			this._component.TradeHistory = new TradeHistory({
				el: $('#J_TradeHistory'),
				id: this.expertId
			});
		}

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
		this._slideNextPage();
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
		console.log(this.expertId)
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
			this.el = this.renderTo(guide2tmpl, data, $('.J_Guide2Wraper'));
			this._requires();
		})
	},

	_renderGuide4() {
		this.render(guide4tmpl, {}, $($('.J_Guide4Wraper')));
	},

	_requires: function() {
		this._component = {
			TradeConut: new TradeConut({
				el: $('#J_TradeCount'),
				id: this.expertId
			})
		}
	},

	_initSliderPage: function() {
		$('#slider').slider({
			loop: false,
			play: false,
			interval: 5 * 1000,
			duration: 500,
			slidePlay: false
		});

		$('.km-slider-nav').addClass('ui set-ui-bg');
	}
})

new FollowGuide();