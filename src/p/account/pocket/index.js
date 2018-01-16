'use strict';

var PageBase = require('../../../app/page-base');
var Util = require('../../../app/util');
var Flipsnap = require('../../../lib/flipsnap');
var Sticky = require('../../../common/sticky');
var Filter = require('./filter');
var numeral = require('../../../lib/numeral');
var tmpl = require('./index.ejs');
var Uri = require('../../../app/uri');

class Pocket extends PageBase {
  constructor(config) {
    super(config);

    var params = new Uri().getParams();
    if (params.header == 'noBack') {
      $('.go-back').hide();
    }
    if (params.header == 'no') {
      $('#J_Header').hide();
    }
    if (params.from) {
      $('.go-back').attr('href', params.from);
    }

    this.flipsnap = Flipsnap('.flipsnap', {
      maxPoint: 4,
      distance: ($('.flipsnap').width() - $(window).width()) / 4
    });

    window.flipsnap = this.flipsnap;
    this.pageNum = 0;
    this.collect = true;
    this.repeatAjax = true
    this.list = [];
    this._getData();
    this._bind();
    this.configStatistics();

    $('nav').sticky();

    this.filter = new Filter({
      el: $('.filters')
    });

    $('#J_List').css('min-height', $(window).height() - $('header').height() - $('nav').height());
  }

  _bind() {
    var doc = $(document);
    this.onlyOne = true;
    doc.on('tap', '.J_Type', $.proxy(this._select, this));
    doc.on('tap', '.msg-close', (e) => {
      $('#J_TopMsg').parent().remove();
    });

    $(window).on('scroll', window, $.proxy(this._showTopbtn,this));
    this.subscribe('get:data', this._filter, this);

    $('.J_FilterAction,.J_Submit').on('click',$.proxy(function () {
      this.list = [];
      this.pageNum = 0;
      this.collect = true;
      this.repeatAjax = true;
    },this))
  }

  _filter(e) {
    this._getData(this.index, e)
  }

  _showTopbtn (e){
      var self = this;
      if($(window).scrollTop() > (parseFloat($('.J_List').eq(0).css('height')) - $(window).height()) ){
        if(this.onlyOne&&this.repeatAjax){
          this.onlyOne = false;
          var index = $('.active').index();
          self.pageNum+=1;
          console.log(111111111)
          this._getData(index, self.requestData);
        }
      }
  }

  _select(e) {
    this.pageNum = 0;
    this.collect = true;
    this.repeatAjax = true;
    this.list = [];
    window.scrollTo(0,0);
    $('#J_Loading').show();
    $('.J_List').html('');
    var _requestData = {};
    var curEl =$(e.currentTarget);
    var curElParentType = $('.filters').attr('data-kind');
    var curElParentStartTime = $('.filters').attr('data-startTime');
    var curElParentEndTime = $('.filters').attr('data-endTime');
    var ul = $('ul', curEl);
    var index = curEl.index();
    if ( curElParentType ) {
      _requestData.type = curElParentType;
    } else {
      _requestData.type = 'all';
    }

    if ( curElParentStartTime&&curElParentEndTime ) {
      _requestData.params = {};
      _requestData.params.date_start = curElParentStartTime;
      _requestData.params.date_end = curElParentEndTime;
    }
    _requestData.desc = $('.filters').attr('data-desc');
    
    if (!curEl.hasClass('active')) {
      curEl.siblings().removeClass('active');
      curEl.addClass('active');

      var currentPoint = this.flipsnap.currentPoint;

      this.flipsnap.moveToPoint(index < 3 ? 0 : index - 2);
      this.filter.reset();
      this._getData(index,_requestData);

      if (index === 1) {
        $('body').addClass('profit-type');
      } else {
        $('body').removeClass('profit-type');
      }
    }
  }

  _getData(index, requestData) {
    var self = this;
    var paramKind = null;
    var type = this.isDemo() ? 'demo' : 'real';
    switch ( index ) {
      case 0: 
        paramKind = 'all';
        break;
      case 1:
        paramKind = 'trade';
        break;
      case 2:
        paramKind = 'withdraw';
        break;
      case 3:
        paramKind = 'deposit';
        break;
      case 4:
        paramKind = 'bonus';
        break;
      case 5:
        paramKind = 'friend_earn';
        break;
      case 6:
        paramKind = 'markup';
        break;
      case 7:
        paramKind = 'hongbao';
        break;
      default:
        paramKind = 'all';
        break;
    };
    var params = {
      access_token: this.cookie.get('token'),
      kind : paramKind,
      page_num : self.pageNum
    };

    if (requestData) {
      params = $.merge(params, requestData.params || {});
    }
    self.params = params;
    self.requestData = requestData;
    if (type === 'real') {
      this.getRealToken().then((realToken) => {
        params.real_token = realToken;
        return this._request(type, params, index, requestData);
      });
    } else {
      this._request(type, params, index, requestData);
    }
  }

  _request(type, params, index, requestData) {
    var self = this;
    requestData = requestData || {};
    $('#J_Loading').show();
    // 日期帅选不走缓存
    if (this.allData && !requestData) {
      this._discuss(this.allData, type, params, index, requestData);
      return;
    }
    this.ajax({
      url: '/v1/user/' + type + '/pagedtransaction/' + (requestData.type ? requestData.type : 'all') + '/',   //transaction
      data: params
    }).then((data) => {
      setTimeout(function(){
        self.onlyOne = true;
      }, 1000);
      if ( data.data.records.length<30 ) {
        self.repeatAjax = false;
      }
      data = data.data;
      // records 
      this.allData = data;

      this._discuss(data, type, params, index, requestData);
    });
    if ( self.collect ) {
      this.ajax({
        url: '/v1/user/' + type + '/pagedtransaction/summary/' + (requestData.type ? requestData.type : 'all') + '/',
        data: params
      }).then((data)=>{
        self.collect = false;
        data = data.data;

        $('#total').text(numeral(data.amount).format('0,0.00'));
        $('#J_ProfitTotal').text(numeral(data.amount).format('0,0.00'));
        var desc = '';
        num = data.trade_notional_amount > 10000 ? (desc = '万', data.trade_notional_amount / 10000) : data.trade_notional_amount;
        var num = numeral(num).format('0,0.00');

        num = desc ? num + desc : num;

        $('#J_AmountTotal').text(num);

      })
    }
  }

  _discuss(data, type, params, index, requestData) {

    data.records.forEach((item) => {
      var desc = this.tags[item.reason]

      item.desc = desc;

      if (item.reason === 801 || item.reason === 802) {
        item.desc = desc + '[' + (item.confirmed === 0 ? '未确认' : '已确认') + ']';

        if (item.confirmed == -1) {
          item.desc = desc + '[失败]';
        }
      } else if (item.reason === 1001) {
        item.desc = desc + '[' + (item.confirmed === 0 ? '未领取' : '已领取') + ']';
      } else if (item.reason === 3001) {
        item.desc = item.amount < 0 ? '亏损' : '盈利';
      } else if (item.reason === 3002) {
        item.desc = '朋友赚我也赚';
      } else if (item.reason === 2017) {
        item.desc = '分享奖金';
      } else if (item.reason === 2018) {
        item.desc = '利息';
      } else if (item.reason === 2019) {
        item.desc = '注册赠金';
      } else if (item.reason === 3003) {
        item.desc = '外佣';
      } else if (item.reason === 3004) {
        item.desc = '内返';
      } else if (item.reason === 2019) {
        item.desc = '注册赠金';
      } else if (item.reason === 2018) {
        item.desc = '利息';
      } else {
        item.desc = '其他';
      }

    });

    var result = null;

    if (index && index !== 0) {
      var selectType = this.types[index];
      result = data.records.filter(function(item) {
        if (typeof selectType !== 'number') {
          return selectType.indexOf(item.reason) !== -1;
        } else {
          return item.reason === selectType;
        }
      });
    }

    result = result || data.records;

    var total = 0;
    var amount = 0;




    result.forEach((item) => {

      item.amountFormate = numeral(item.amount).format('0,0.00')

      if (this.getFilter(index, item)) {
        total += item.amount;

        if (item.trade_notional_amount) {
          amount += item.trade_notional_amount;
          item.trade_notional_amount = numeral(item.trade_notional_amount).format('0,0');
        }
      }
    });


    if (index === 2) {
      result.tip = true;
    }

    result = result.sort(function(v1, v2) {
      return Util.getTime(v2.update_at) - Util.getTime(v1.update_at);
    });

    $('#J_Loading').hide();

    result.indexVal = index || 0;

    this.list = this.list.concat( result );
    this.list.indexVal = index || 0;
    this.render(tmpl, this.list, $('#J_List'));
    this._pos();

    if ($('body').hasClass('profit-type')) {} else {
      $('#J_BottomName').text(requestData.desc);
    }

    if (requestData.region && !index == 1) {
      $('footer').addClass('region');
    } else {
      $('footer').removeClass('region');
    }

    this.index = index;
  }

  getFilter(index, item) {
    index = index || 0;
    switch (index) {
      case 0:

        return item.confirmed == 1;

        break;
      case 1:
        return item.reason == 3001;

        break;
      case 2:

        return item.reason == 802 && item.confirmed == 1;

        break;
      case 3:

        return item.reason == 801 && item.confirmed == 1;

        break;
      case 4:

        return [0, 700, 701, 1002, 2010, 2011, 2012, 2014, 2015, 2016, 2017, 2018, 2019].indexOf(item.reason) !== -1;

        break;
      case 5:

        return item.reason == 3002;

        break;
      case 6:

        return [3003, 3004].indexOf(item.reason) !== -1;

        break;
      case 7:

        return [1001, 2013].indexOf(item.reason) !== -1 && item.confirmed == 1;

        break;
    }
  }

  _pos() {
      $.each($('.arrow-right'), function(index, item) {
      item = $(item);
      var parent = item.parent().parent();
      item.css({
        top: (parent.height() - item.height()) / 2
      });
    });
  }

  defaults() {
    return {
      tags: {
        0: '系统赠予',
        700: '入金赠金',
        701: '活动赠金',
        801: '入金',
        802: '出金',
        1001: '红包',
        1002: '活动奖金',
        2010: '任务奖金',
        2011: '考试奖金',
        2012: '升级奖金',
        2013: '邀请奖金',
        2014: '签到奖金',
        2015: '订单竞猜奖金',
        2016: '每日竞猜奖金',
        2017: '分享奖金',
        2018: '利息',
        2019: '注册赠金',
        3001: '交易盈亏',
        3002: '朋友赚',
        3003: '外佣',
        3004: '内返',
        5001: '用户兑换商品消费'
      },

      types: ['all', 3001, 802, 801, [0, 700, 701, 1002, 2010, 2011, 2012, 2014, 2015, 2016, 2017, 2018, 2019], 3002, [3003, 3004],
        [1001, 2013]
      ]
    }
  }
}

new Pocket();