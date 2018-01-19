"use strict";
var Base = require('../../app/base');
var Cookie = require('../../lib/cookie');
var Config = require('../../app/config');
var Util = require('../../app/util');
var sticky = require('../../common/sticky');
var SildeMenu = require('../../common/slide-menu');
var BottomNav = require('../../common/bottom-nav');
// var LoadingDesc = require('../../common/loading-desc');
var tmpl = require('./index.ejs');

function ActualOrder() {
	ActualOrder.superclass.constructor.apply(this, arguments);

	if (Cookie.get('token')) {
		this.curId;
		this._init();
		new BottomNav({
			page: 'actual'
		});
	} else {
		window.location = getLoginWL();
	}
}

Base.extend(ActualOrder, Base, {
	_init: function() {
		this._bind();
		this._initSticky();
		this._getData();
		new SildeMenu({
	      el: $('#J_SlideMenu'),
	      page: 'option'
	    })
	},

	_bind: function() {
		var doc = $(document);
		this.el = $('#J_OptionBanner');
      	this.category = $(".J_CategoryFilter");
		// $('.J_Filter').on('click', $.proxy(this._fold, this));
  		$('.J_OptionBannerMask').on('click', $.proxy(this._toggleFilter, this));

      	$('.J_Trigger').on('click', $.proxy(this._toggleFilter, this));
      	$('.J_Item').on('click', $.proxy(this._switch, this));
	},

	_fold: function(e) {
	    var bodyEl = $('#J_Page'),
	      htmlEl = $('html'),
	      footerEl = $('footer');

	    if (bodyEl.hasClass('move-x')) {
	      $('body').removeClass('unfold');

	      footerEl.hide();

	      setTimeout(() => {
	        this.el.hide();
	       
	      }, 300);

	      this.el.css({
	        top: 0
	      });
	      $('.J_OptionBannerMask').css({
	        top: 0
	      })
	      bodyEl.removeClass('move-x');

	      $('.J_OptionBannerMask').hide();
	      bodyEl.css({
	        height: 'auto'
	      });

	     setTimeout(()=>{
	       footerEl.show();
	     },500);

	    } else {
	      this.el.show();
	      $('body').addClass('unfold');
	      var scrollTop = $(window).scrollTop();
	      this.el.css({
	        top: scrollTop
	      });
	      $('.J_OptionBannerMask').css({
	          top: scrollTop
	      })
	      bodyEl.addClass('move-x');

	      bodyEl.css({
	        height: $(window).height(),
	      });
	      $('.J_OptionBannerMask').show();

	      footerEl.hide();
	    }

	},

	_toggleFilter: function(e) {
      this.el.toggleClass('active');
      $('.J_OptionBannerMask').toggleClass('active');
  	},

  	_switch: function(e) {
	    var curEl = $(e.currentTarget),
	        index = curEl.index();
	    this.curIndex = index;
	    if (!curEl.hasClass('active')) {
	        curEl.siblings().removeClass('active');
	        curEl.addClass('active');
	        $('.cureent', this.el).text(curEl.text());    
	    }

	    // this._fold();

	    this._getData();

	},

	_getData: function() {
		var self = this;
		var params = this._getParams();
		this.ajax({
			url: '/v1/order/latest/order/',
			data: params
		}).then(function(data) {
			data = data.data;
			self._render(data);
		})
	},

	_render: function(data) {
		var self = this;
		var list, firstItem;
		var now_date = Date.now();
		var baseTime = 1000 * 60;

		if (!$.isArray(data)) {
			return;
		}

		list = data.map((item) => {
			var desc = '刚刚';
			var item_time = Util.getTime(item.openTime);
			var minTime = now_date - item_time;
			var seconds = Math.floor(minTime / 1000);  // 秒
			var minutes = Math.floor(minTime / (1000 * 60));  // 分钟
			var hours = Math.floor(minTime / (1000 * 3600));  // 小时
			var days = Math.floor(minTime / (1000 * 3600 * 24));  // 天

			if (hours > 24) {
				desc = days + '日前';
			} else if (minutes > 60) {
				desc = hours + '小时前';
			} else if (seconds > 60) {
				desc = minutes + '分钟前';
			}

			item.isShowDesc = desc;

			item.avatar = item.avatar ? Config.getAvatarPrefix(item.avatar) : getDefaultIconWL();

			return item;
		});

		firstItem = list[0];


		if (firstItem && firstItem.isShowNow && this.curId != firstItem.id) {
			this.curId = firstItem.id;
			firstItem.isNowRender = true;
			setTimeout(() => {
				('.J_SymbolItem.now', this.el).removeClass('now');
			}, 2000)
		}

		this.render(tmpl, {data: list}, $('.J_List'));

		setTimeout(function() {
			self._getData();
		}, 1000 * 30)
	},

	_getParams: function() {
		return {
			access_token: Cookie.get('token'),
			symbols: '',
			type: this.curIndex ? 'all' : 'follow',
			limit: 8
		}
	},

	_initSticky: function() {
		$('#J_Header').sticky();
	},

	defaults: function() {
		return {
			curIndex: 1,//   默认全部
			base5Time: {
				time: 1000 * 60 * 5,
				desc: '5分钟前'
			},
			base15Time: {
				time: 1000 * 60 * 15,
				desc: '15分钟前'
			},
			base30Time: {
				time: 1000 * 60 * 30,
				desc: '30分钟前'
			},
			base60Time: {
				time: 1000 * 60 * 60,
				desc: '1小时前'
			},
			base5HTime: {
				time: 1000 * 60 * 60 * 6,
				desc: '6小时前'
			},
			base12HTime: {
				time: 1000 * 60 * 60 * 12,
				desc: '12小时前'
			},
			base1DTime: {
				time: 1000 * 60 * 60 * 24,
				desc: '1日前'
			},
			base2DTime: {
				time: 1000 * 60 * 60 * 24 * 2,
				desc: '2日前'
			},
			base3DTime: {
				time: 1000 * 60 * 60 * 24 * 3,
				desc: '3日前'
			},
			base4DTime: {
				time: 1000 * 60 * 60 * 24 * 4,
				desc: '4日前'
			},
			base5DTime: {
				time: 1000 * 60 * 60 * 24 * 5,
				desc: '5日前'
			}
		}
	}

});

new ActualOrder();