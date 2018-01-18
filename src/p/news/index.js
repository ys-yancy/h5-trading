
'use strict';
var Base = require('../../app/base');
var Util = require('../../app/util');
var SildeMenu = require('../../common/slide-menu');
var Sticky = require('../../common/sticky');
var tmpl = require('./index.ejs');
function News() {
	News.superclass.constructor.apply(this, arguments);
	this.init();
}

Base.extend(News, Base, {
	init: function() {
		this.firstRender = true;
		this._initAttrs();
		this._bind();
		this._getData();
		this._setInterval();
		this._requires();
		this._initSticky();
		new SildeMenu({
	      el: $('#J_SlideMenu'),
	      page: 'option'
	    })
	},

	_bind: function() {
		this.noScroll = true;
	    $(window).on('scroll', _.bind(this.getData, this))
  	},

  	getData: function() {
  		/*
  		 * 函数节流
  		 */
  		var self = this;
  		self.noScroll = false;

  		if ( $(window).scrollTop() < 100 ) {
  			self.noScroll = true;
  			this.firstRender = true;
  		}

  		clearTimeout(this.getDtaTimer);

  		this.getDtaTimer = setTimeout(() => {
  			loadMore();
  		}, 50);

  		function loadMore() {
  			var isLoadMore = self.isLoadMore();
	  		if ( isLoadMore ) {
	  			self.firstRender = false;
	  			self._getData({
	  				endtime: self.lastTime
	  			});
	  		}
  		}
  	},

  	_getData:function(params) {
		params = params || {};
		var data = this._getParams();
		data = $.extend(data, params);
		this._request(data);
	},

	_request: function(params) {
		this.ajax({
			url: '/v1/news/list/',
			data: params
		}).then((data) => {
			data = data.data;

			this._setLastTime(data);

			var curId = data[0].id;

			if ( !this.firstId || (this.firstId != curId && this.noScroll)) {
				data[0].isFirst = true;
			}
			this.firstId = curId;
			this._render(data, this.firstRender);

		})
	},

	_setInterval: function() {

		setTimeout(() => {
			if ( this.noScroll ) {
				this._getData();
			}
			this._setInterval();
		}, 1000 * 60);
	},

	_getParams: function() {
		var data = {
			start: '0',
			length: '20',
			time: Util.getDate(),
			type: '01',
			resource: 'jin10',
		}
		return data;
	},

	_setLastTime: function(data) {
		var lastData= data[data.length - 1];
		this.lastTime = data[data.length - 1].time;
		return this.lastTime;
	},

	_clearFirst: function() {
		setTimeout(() => {
			$('.first', this.bdEl).removeClass('first');
		}, 1800)
	},

	isLoadMore: function() {
		var baseHeight = 200; // 缓存高度
		var win = $(window);
		var doc = $(document);
		return doc.height() - win.scrollTop() - win.height() - baseHeight <= 0	
	},

	_render: function(data, isFirstRender) {
		if (isFirstRender) {
			this.render(tmpl, {list: data}, this.listContentEl);
		} else {
			this._hideLoading();
			this.renderTo(tmpl, {list: data}, this.listContentEl);
		}
		
		this._clearFirst();
		// $(window).scrollTop($('#J_Header').height());
	},

	_hideLoading: function() {
		$('.loading').hide();
	},

	_requires: function() {
		if (getHasCalendar()) {
			$('#nav').show();
			$('.content').addClass('hasCal');
		}
	},

	_initSticky: function() {
    	// $('nav').sticky();
  	},

	_initAttrs: function() {
		this.bdEl = $('.content');
		this.listContentEl = $('.list', this.bdEl);

		// 需要隐藏表头
		var search = window.location.search;
        if (search.indexOf('from=iphoneapp') != -1 || search.indexOf('from=androidApp') != -1) {
        	$('.footer').hide();
            $('#J_Header').parent().hide();
            $('nav').css('top', '0');
            this.bdEl.css('padding-top', '2rem');
            var linkEl = $('.link');
            var curLink= linkEl.prop('href');
            $('.link').prop('href', curLink + search);
        }
	}
});

new News();