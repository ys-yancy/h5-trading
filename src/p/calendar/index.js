
'use strict';
var Base = require('../../app/base');
var Util = require('../../app/util');
var Sticky = require('../../common/sticky');
var tmpl = require('./index.ejs');
function Calendar() {
	Calendar.superclass.constructor.apply(this, arguments);
	this.init();
}

Base.extend(Calendar, Base, {

	init: function() {
		this._getData();
        this._initAttrs();
		// this._initSticky();
	},

	_getData: function() {
        var params = this.params;

        this.ajax({
            url: '/v1/calendar/list/',
            type: 'GET',
            data: params
        }).then((data) => {
            data = data.data;

            var oldWeek = 0,
                hasValue,
                newDateIndex, 
                list = [];

            for ( var j = data.length - 1; j >= 0; j-- ) {
            	if ( !hasValue && data[j].currentValue ) {
                    hasValue = true;
                    data[j].curValue = true;
                    newDateIndex = i;
                    break;
                }
            }

            for ( var i = 0, len = data.length; i < len; i++ ) {

                if (data[i].weekend > oldWeek) {
                    var times = [...data[i].time];
                    var day = ''+ times[8] + times[9],
                        mouth = ''+ times[5] + times[6];
                    list.push({
                        nextWeek: true,
                        mouth: `${mouth}月${day}日`,
                        day: `${this.weekObj[data[i].weekend]}`
                    })
                };

                list.push(data[i]);
                this.list = list;

                oldWeek = data[i].weekend;
            }

            this.render(tmpl, {data: list}, $('#J_List'));
          	this._setInterval();
          	this._scroll();
        })
    },

    _setInterval: function() {
    	setTimeout(() => {
    		this._getData();
    	}, 1000 * 60 * 2)
    },

    _scroll: function(e) {
        var moveEl = $('.cur-value', '#J_List');
        var navEl = $('nav');
        var headerEl = $('header');
        var position = moveEl.offset();
        if (moveEl.length > 0 && moveEl.prev().length > 0) {
            var scrollTop = position.top - navEl.height() - $('#J_Header').height();
            $(window).scrollTop(scrollTop);
        }
       
    },

    _initAttrs:function() {
        // 需要隐藏表头
        var search = window.location.search;
        if (search.indexOf('from=iphoneapp') != -1 || search.indexOf('from=androidApp') != -1) {
            $('.footer').hide();
            $('#J_Header').parent().hide();
            $('nav').css('top', '0');
            $('.content').css('padding-top', '2rem');
            var linkEl = $('.link');
            var curLink= linkEl.prop('href');
            $('.link').prop('href', curLink + search);
        }
    },

    _initSticky: function() {
    	$('nav').sticky();
  	},

    defaults: function() {
        return {
            // noValueIndex: '',
            // weeks: ['上一周', '本周', '下一周'],
            weekObj: {
                '1': '一',
                '2': '二',
                '3': '三',
                '4': '四',
                '5': '五',
                '6': '六',
                '7': '七'
            },
            params: {
                weekend: '',
                weightiness: '',
                dataTypeName: '',
                countryName: ''
            }
        }
    }
});

new Calendar();