"use strict";

var Base = require('../../app/base');
var Config = require('../../app/config');
var Cookie = require('../../lib/cookie');
var Sticky = require('../../common/sticky');
var SildeMenu = require('../../common/slide-menu');
var BottomNav = require('../../common/bottom-nav');
var tmpl = require('./index.ejs');

function FollowList() {
	FollowList.superclass.constructor.apply(this, arguments);
  if ( Cookie.get('token') ) {
		this._init();
		new BottomNav({
			page: 'master'
		});
  } else {
    window.location = getLoginWL();
  }
}

Base.extend(FollowList, Base, {
	_init: function() {
		this._initSticky();
		this._getData();
    new SildeMenu({
      el: $('#J_SlideMenu'),
      page: 'option'
    })
	},

    _updateGendanList: function() {
      this._getData();
    },

	_getData: function() {
  		var params = {
        access_token: Cookie.get('token')
      }
  		this._request(params);
  	},

  	_request: function(params) {
  		this.ajax({
  			url: '/v1/follow/follower/current/expert/list/',
  			data: params
  		}).then((data) => {
  			data = data.data;
  			this._render(data);
  		})
  	},

  	_render: function(data) {
      	data = data.map((item) => {
        	item.img = item.img ? Config.getAvatarPrefix(item.img) : getDefaultIconWL();
        	return item;
      	})
  		this.render(tmpl, {list: data}, $('.J_List'));
  	},

  	_initSticky: function() {
    	$('nav').sticky();
  	}
})

new FollowList();