/**
 *   交易榜单
 */

'use strict';
var Base = require('../../app/base');
var Config = require('../../app/config');
var Cookie = require('../../lib/cookie');
var Sticky = require('../../common/sticky');
var SildeMenu = require('../../common/slide-menu');
var BottomNav = require('../../common/bottom-nav');
// var CreateMiniChart = require('./chart/mini-line');
var tmpl = require('./index.ejs.html');

function MasterList() {
	MasterList.superclass.constructor.apply(this, arguments);

  if ( Cookie.get('token') ) {
    this._init();
    new BottomNav({
			page: 'master'
		});
  } else {
    window.location = getLoginWL();
  }
}

Base.extend(MasterList, Base, {
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
      doc.on('tap', '.J_Fn', $.proxy(this._showFilter, this));
      doc.on('tap', '.J_Item', $.proxy(this._switch, this));

      doc.on('tap', (e) => {
        e.preventDefault();
        e.stopPropagation();
        var curEl = $(e.target);
        
        if (curEl.parents('.fn').length <= 0 && !curEl.hasClass('fn')) {
          this._hideFilter();
        }
      })
  },

  _showFilter: function() {
    var popupEl = $('#J_FnList');

    popupEl.show();
    setTimeout(() => {
      popupEl.addClass('show');
    }, 0)
  },

  _hideFilter: function() {
    var popupEl = $('#J_FnList');

    popupEl.removeClass('show');
    setTimeout(() => {
      popupEl.hide();
    }, 50);
  },

  _switch: function(e) {
      e.stopPropagation();
      e.cancelBubble = true;
      var curEl = $(e.currentTarget),
          index = curEl.index();
      this.curIndex = index;

      if (!curEl.hasClass('active')) {
          curEl.siblings().removeClass('active');
          curEl.addClass('active');  
      }
      this._getData();
      this._hideFilter();
  },

	_getData: function() {
		var params = this._getParams();
    var source = this._getSource();
    this._shwLoading();
  	this._request(params, source);
	},

	_request: function(params, source) {
  		/**
  		 * @ yield_rate_7days
  		 * @ yield_rate_30days
  		 * @ yield_rate
  		 */
  		var source = source || 'yield_rate';
  		this.ajax({
  			url: '/v1/follow/rank/expert/profit/'+ source +'/',
  			data: params
  		}).then((data) => {
        data = data.data;
  			this._render({
          data: data,
          sourceparm: this.sourceparm,
          sourceDesc: this.sourceDesc
        });
  		})
  },

	_render: function(data) {
    data.data = data.data.map((item) => {
        item.img = item.img ? Config.getAvatarPrefix(item.img) : getDefaultAvatarUrl();
        return item;
    })

		this.render(tmpl, data, $('.J_List'));
		// this._renderCharts(data);
	},

	_renderCharts: function(data) {
		var chartWraperEls = $('.J_TradelistChart', $('.J_List'));

		for ( var i = 0, len = data.length; i < len; i++ ) {
			var list = [], profitList = data[i].profit_history || [];
			var chartWraperEl = chartWraperEls[i];
     
			for ( var j = 0, le = profitList.length; j < le; j++ ) {
          if (!isNaN(parseFloat(profitList[j].amount))) {
            list.push(parseFloat(profitList[j].amount))
          }
			}
			new CreateMiniChart({
				el: chartWraperEl,
			  chartName: 'trade-list-charts-rate',
			  data: list
			})
		}
	},

	_getParams: function() {
		var params = new Object();
		params.access_token = Cookie.get('token');
		return params;
	},

	_getSource: function() {
    var activeEl = $('.active', this.category);
    var index = activeEl.index();
    var curSource = this.sourceUrls[index];
    this.sourceparm = this.sourceparms[index];
    this.sourceDesc = this.sourceDescs[index];
		return curSource;
  },
  
  _shwLoading: function() {
    $('.J_List').html(' <li class="ui loading"><span class="circel"></span><span class="loading-text">加载中...</span> </li>');
  },

  _initSticky: function() {
    $('nav').sticky();
  },

	defaults: function() {
		return {
      sourceUrls: ['yield_rate','yield_rate_7days', 'yield_rate_30days', 'yield_rate_30days_loss'],
      sourceparms: ['yield_rate','yield_7days', 'yield_30days', 'yield_30days_loss'],
      sourceDescs: ['累计盈利','近7日收益', '近30日收益', '近30日亏损']
		}
	}	
})

new MasterList();