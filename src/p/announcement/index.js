'use strict';
var Base = require('../../app/base.js');
var Util = require('../../app/util');
var WeiXin = require('../../app/weixin');
var PageBase = require('../../app/page-base.js');
var Dialog = require('../../common/dialog');
var Config = require('../../app/config');
var IndexTeml = require('./index.ejs');
var IndexTeml2 = require(('./index2.ejs'));

class AnMent extends PageBase {
	constructor(){
		super();
		this.newData = [];
		this.lastIndex = null;
		this._getData();
		this._init();
	}
	_init() {
		var doc = $(document);
		doc.on('tap','.aMent_cont',$.proxy(this._detailsAment,this));
		$('.details_back').on('tap',$.proxy(this._aMentEvent,this));
		if ( Util.isWeixin() ) {
			var url = location.href;
			this.setupWeiXinShare('announcement',url);
		}
	}
	_getData() {
		var self = this;
		this.ajax({url : '/v1/announcement/list/?access_token=' + Cookie.get('token') + '&kind=all'})
		.then(function (data) {
	
			if ( data.data.length > 0 ) {
				var _data = [],oldData = [];
				for ( var i = 0; i < data.data.length; i++ ) {
				
					var reData = data.data[i].start_time.replace(/-| |:/g,'');

					_data.push(Number(reData));
				}

				$.extend(oldData, _data);
				
				_data.sort(function ( a,b ) { return b-a; })

				for ( var j = 0; j < _data.length; j++ ) {
					var Index = oldData.indexOf(_data[j]);

					//解决发布时间相同时,出现相同的公告问题
					if ( self.lastIndex === Index ) {
						Index++;
					}
					self.newData.push(data.data[Index]);
					self.lastIndex = Index;
				}
				
				self.render(IndexTeml,self.newData,$('#content'))
			}
		})
	}
	_detailsAment(e) {
		var self = this;
		var index = $(e.target).attr('data-id') || $(e.target).parent().attr('data-id')
		self.render(IndexTeml2,self.newData[index],$('#content_details'))
		$('.aMent_list').hide();
		$('.aMent_details').show();
	}

	_aMentEvent() {
		$('.aMent_list').show();
		$('.aMent_details').hide();
	}
}

new AnMent();
