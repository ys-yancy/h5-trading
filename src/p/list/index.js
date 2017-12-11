var Base = require('../../app/base');
var PageBase = require('../../app/page-base');

var Banner = require('../../common/banner/index');
var Dialog = require('../../common/dialog/index');
var InfinityScroll = require('../../common/infinite-scroll/index');
var Uri = require('../../app/uri');
var Toast = require('../../common/toast');
var Cookie = require('../../lib/cookie');
var storage = require('../../app/storage');
var CustomerService = require('../../common/customer-service');
var tmpl = require("./index.ejs");
var listTmpl = require('./list.ejs');


function List() {
  List.superclass.constructor.apply(this, arguments);
  var self = this;
  this.getToken().then(function() {
    self.init();
  });
}

Base.extend(List, PageBase, {
  init: function() {
    this._requires();
    this._header();
    this._bind();
    this._initDialog();
    this.configStatistics();
  },

  _bind: function() {
    var doc = $(document),
      formEl = $('#J_Form');

    doc.on('tap', '.J_CloseSearch', $.proxy(function(e) {
      $('.input-txt').val('');
    }, this));

    formEl.on('submit', $.proxy(this._search, this));

    doc.on('click', '.action', $.proxy(this._action, this));

    doc.on('tap', '.J_Link', $.proxy(this._link, this));

    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }
  },

  _requires: function() {
    var bannerEl = $('#J_Banner');

    if (bannerEl.length) {
      this.banner = new Banner({
        el: $('#J_Banner')
      });
    }
    // new CustomerService();
  },

  _search: function(e) {
    var el = $(e.currentTarget),
      inputEl = $('.input-txt', el),
      val = inputEl.val();

    e.preventDefault();

    if (!val) {
      location.reload();
      return;
    }

    location.href = './list.html?kw=' + encodeURIComponent(val);
  },

  _header: function() {
    var self = this,
      params = new Uri().getParams(),
      q = params.kw,
      title = params.title;


    if (q === undefined) {
      title = title || '类别';
      title = decodeURIComponent(title);

      $('title').html(title);
      $('.title', this.headerEl).html(title);
      var category = new Uri().getParam('category');

      this._getOption().then(function(optionList) {
        self._initInfinite(category, optionList);
      });

      return;
    }

    var headerEl = $('#J_Header'),
      title = $('.title', headerEl),
      searchEl = $('.search-wrapper', headerEl),
      inputEl = $('.input-txt', headerEl);

    title.hide();
    searchEl.show();
    inputEl.val(q).focus();

    this._query(q);
  },

  _query: function(q) {
    var self = this,
      token = Cookie.get('token');

    //this.containerEl.html('<li>正在加载中...</li>');

    this._getOption().then((optionList) => {
      var count = 20;
      var params = {
        access_token: Cookie.get('token'),
        kw: q,
        start: 0,
        count: count
      };
      var url = '/v1/symbol/search/';

      return new InfinityScroll({
        loadingConfig: {
          el: $('#J_Loading'),
          needInit: false,
        },
        params: params,
        el: this.containerEl,
        url: url,
        tmpl: tmpl,
        emptyTmpl: this.emptyTmpl,
        infinite: true,
        beforeRequest: function(params) {
          return {
            count: count,
            start: params.page * count
          };
        },
        parse: function(data, params) {
          if (data && data.data) {
            var hasNextPage = true;

            if (data.data.length === 0 || data.data.length < count) {
              hasNextPage = false;
            }

            $.each(data.data, function(index, item) {
              var symbol = item.symbol;

              item.kw = q;

              item.add = optionList.indexOf(symbol) !== -1 ? false : true;
            });


            return {
              data: data.data,
              hasNextPage: hasNextPage
            }
          }

          return data;
        },

        callback: function() {
          //   $('p.name').marquee()
          // $('.J_Marquee').each(function(index, item) {
          //     var itemEl = $(item);
          //     if (itemEl.width() > itemEl.parent().width()) {
          //         itemEl.replaceWith('<marquee >' + itemEl.html() + '</marquee>');
          //     }
          // })
        }
      });

      // self.ajax({
      //   url: '/v1/symbol/search/',
      //   data: {
      //     access_token: token,
      //     kw: q,
      //     count: 20
      //   }
      // }).then(function(data) {
      //   data = data.data;
      //   $.each(data, function(index, item) {
      //     var symbol = item.symbol;
      //     item.kw = q;

      //     item.add = optionList.indexOf(symbol) !== -1 ? false : true;
      //   });

      //   self.render(tmpl, data, self.containerEl, true);
      //   $('#J_Loading').hide();
      // });
    });
  },

  _getOption: function() {
    var self = this,
      d = new $.Deferred(),
      optionList = this._getOptionList(),
      url = this._getUrl();

    if (!optionList) {
      var token = Cookie.get('token');
      this.ajax({
        url: url,
        data: {
          access_token: token
        }
      }).then(function(data) {
        data = data.data;
        var optionList = self._saveOptionData(data);
        d.resolve(optionList);
      });
    } else {
      d.resolve(optionList);
    }

    return new d.promise();
  },

  _getUrl: function() {
    // 实盘  actual quotation
    var demo = this.isDemo();

    var url = demo ? '/v3/demo/symbols/' : '/v3/real/symbols/';
    return url;
  },

  _getOptionList: function() {
    var key = this._getKey(); //isDemo() ? 'demoOptionList' : 'optionList';

    var optionList = JSON.parse(storage.get(key));

    return optionList;
  },

  _getKey: function() {
    var key = this.isDemo() ? 'demoOptionList' : 'optionList';
    var token = Cookie.get('token');

    return token + key;
  },

  _setOptionList: function(optionList) {
    var key = this._getKey();
    var optionList = storage.set(key, optionList);
  },

  _saveOptionData: function(data) {
    var optionList = [],
      key = this._getKey();

    $.each(data, function(index, item) {
      var symbol = item.policy.symbol;
      optionList.push(symbol);
    });

    storage.set(key, optionList);

    return optionList;
  },

  _action: function(e) {
    var self = this,
      curEl = $(e.currentTarget),
      itemEl = curEl.parent('.item'),
      add = itemEl.hasClass('add'),
      symbol = itemEl.attr('data-symbol'),
      message;

    e.preventDefault();
    this.curItemEl = itemEl;
    this.symbol = symbol;

    if (!this.banner.isLogin()) {
      return;
    }

    if (add) {
      this.ajax({
        url: '/v1/user/fav/symbol/',
        type: 'post',
        data: {
          symbol: symbol,
          access_token: Cookie.get('token')
        }
      }).then(function(data) {
        message = '添加成功';
        self.add = true;
        self._callback();
        new Toast(message);
        self._add(symbol);
      });
    } else {
      this.add = false;
      this.delDialog.show();
    }
  },

  _link: function(e) {
    var curEl = $(e.currentTarget),
      href = curEl.attr('href'),
      itemEl = curEl.parent('.item'),
      option = 'add';

    e.preventDefault();

    if (!itemEl.hasClass('add')) {
      option = 'remove';
    }

    location.href = href + '&option=' + option;

  },

  _removeFav: function() {
    var self = this;

    this.ajax({
      url: '/v1/user/fav/symbol/',
      type: 'delete',
      data: {
        symbol: this.symbol,
        access_token: Cookie.get('token')
      }
    }).then(function(data) {
      self._callback();
      self._del(self.symbol);
    });
  },

  _add: function(symbol) {
    var optionList = this._getOptionList();

    if (optionList.indexOf(symbol) === -1) {
      optionList.push(symbol);
      this._setOptionList(optionList);
    }
  },

  _del: function(symbol) {
    var optionList = this._getOptionList();

    var index = optionList.indexOf(symbol);

    if (index !== -1) {
      optionList.splice(index, 1);
      this._setOptionList(optionList);
    }
  },

  _callback: function() {
    this.add ? this.curItemEl.removeClass('add') : this.curItemEl.addClass('add');
  },

  _initDialog: function() {

    this.delDialog = new Dialog({
      isShow: false,
      confirmAndClose: true,
      tmpl: this.delTmpl,
      confirmCallback: $.proxy(this._removeFav, this)
    });

    this.addDialog = new Dialog({
      isShow: false,
      tmpl: this.addTmpl,
      callback: $.proxy(this._callback, this)
    });
  },

  _initInfinite: function(category, optionList) {
    var count = 20;
    var params = {
      access_token: Cookie.get('token'),
      category: category,
      start: 0,
      count: count
    };
    var url = this._getUrl();

    return new InfinityScroll({
      loadingConfig: {
        el: $('#J_Loading'),
        needInit: false,
      },
      params: params,
      el: this.containerEl,
      url: url,
      tmpl: listTmpl,
      emptyTmpl: this.emptyTmpl,
      infinite: true,
      beforeRequest: function(params) {
        return {
          count: count,
          start: params.page * count
        };
      },
      parse: function(data, params) {
        if (data && data.data) {
          var hasNextPage = true;

          if (data.data.length === 0 || data.data.length < count) {
            hasNextPage = false;
          }

          $.each(data.data, function(index, item) {
            var symbol = item.policy.symbol;

            item.add = optionList.indexOf(symbol) !== -1 ? false : true;
          });

          return {
            data: data.data,
            hasNextPage: hasNextPage
          }
        }

        return data;
      },

      callback: function() {
        //   $('p.name').marquee()
        // $('.J_Marquee').each(function(index, item) {
        //     var itemEl = $(item);
        //     if (itemEl.width() > itemEl.parent().width()) {
        //         itemEl.replaceWith('<marquee >' + itemEl.html() + '</marquee>');
        //     }
        // })
      }
    });
  },

  attrs: {
    url: '/v3/real/symbols6/',
    demoUrl: '/v3/demo/symbols6/',
    headerEl: $('#J_Header'),

    listEl: $('#J_List'),

    containerEl: $('#J_Container'), //$('#J_Container'),

    curItemEl: null,

    emptyTmpl: '<li class="empty">你还没有交易信息</li>',

    delTmpl: [
      '<div class="dialog J_Dialog dialog-trade del-dialog " id="J_Dialog">',
      '   <span class="wrapper-icon"><span class="icon"></span></span>',
      '   <div class="dialog-content J_Content">',
      '        <p>确认删除自选？</p>',
      '   </div>',
      '   <div class="dialog-buttons clearfix">',
      '       <span class="dialog-btn J_DialogClose">取消</span>',
      '       <span class="dialog-btn J_DialogConfirm">删除</span>',
      '   </div>',
      '</div>',
      '<div class="dialog-mask J_DialogMask"></div>'
    ].join(''),

    addTmpl: [
      '<div class="dialog J_Dialog dialog-trade add-dialog " id="J_Dialog">',
      '   <span class="wrapper-icon"><span class="icon"></span></span>',
      '   <div class="dialog-content J_Content">',
      '        <p>已添加到自选</p>',
      '   </div>',
      '   <div class="dialog-buttons clearfix">',
      '       <span class="dialog-btn J_DialogClose">确认</span>',
      '   </div>',
      '</div>',
      '<div class="dialog-mask J_DialogMask"></div>'
    ].join('')
  }
});

new List();