var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var Banner = require('../../common/banner/index');
var Uri = require('../../app/uri');
var storage = require('../../app/storage');
var Cookie = require('../../lib/cookie');
var Flipsnap = require('../../lib/flipsnap');
var Toast = require('../../common/toast');
var Dialog = require('../../common/dialog/index');
var CustomerService = require('../../common/customer-service');
var InfinityScroll = require('../../common/infinite-scroll/index');
var tmpl = require('./idnex.ejs');
var listTmpl = require('./list.ejs');
function Cat() {
    Cat.superclass.constructor.apply(this, arguments);
     var self = this;
    this.getToken().then(function() {
        self.init();
    });
}

Base.extend(Cat, PageBase, {
    init: function() {
        this._initTopbar();
        this._bind();
        this._getData();
        this._initDialog();
        this.configStatistics();
    },

    _bind: function() {
        var doc = $(document),
            formEl = $('#J_Form');

        doc.on('tap', '.J_Type', $.proxy(this._switch, this));

        formEl.on('submit', $.proxy(this._search, this));

        doc.on('click', '.action', $.proxy(this._action, this));

        doc.on('tap', '.J_Link', $.proxy(this._link, this));

        doc.on('tap', '.J_OpenSearch', $.proxy(function(e) {
            this.headerEl.addClass('unfold');
        }, this));

        doc.on('tap', '.J_CloseSearch', $.proxy(function(e) {
            this.headerEl.removeClass('unfold');
        }, this));

        // 添加默认微信分享
        if (this.isWeixin()) {
          this.setupWeiXinShare('default_invite');
        }
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
        return false
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

    _switch: function(e) {
        var self = this;
        var curEl =$(e.currentTarget);
        var linkEl = $('.link', curEl);
        var category = linkEl.attr('data-category');
        var index = curEl.index();

        if (curEl.hasClass('active')) {
            return;
        }

        this._getOption().then(function(optionList) {
            curEl.siblings().removeClass('active');
            curEl.addClass('active');
            self.contentEl.html('');
            self.initInfinite && self.initInfinite._destory(this.initInfinite);
            self.initInfinite = self._initInfinite(category, optionList);
        });
        // flipsnap.toNext();
        //flipsnap.toPrev();
        // this.flipsnap.moveToPoint(index < 3 ? 0 : index - 5);
    },

    _setOptionList: function(optionList) {
        var key = this._getKey();
        var optionList = storage.set(key, optionList);
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

    _getOptionList: function() {
        var key = this._getKey();
        var optionList = JSON.parse(storage.get(key));

        return optionList;
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

    _getData: function() {
        var self = this,
            token = Cookie.get('token');

        this.ajax({
            url: '/v1/symbol/category/',
            data: {
                access_token: token
            }
        }).then(function(data) {
            self.render(self.tmpl, data.data, self.navListEl);
            // self.render(self.contentTmpl, data.data, self.contentEl);
            self._initFlipsnap(parseInt(data.data.length / 2));
            setTimeout(() => {
                $('.J_Type').eq(0).trigger('tap').addClass('active');
            }, 0)
        });
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

        var self = this,
          token = Cookie.get('token');
        this._getOption().then((optionList) => {
            self.contentEl.html('');
            var count = 20;
            var params = {
            access_token: Cookie.get('token'),
            kw: val,
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
            el: this.contentEl,
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

                  item.kw = val;

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
            }
          });
        });
    },

    _getKey: function() {
        var key = this.isDemo() ? 'demoOptionList' : 'optionList';
        var token = Cookie.get('token');

        return token + key;
    },

    _getUrl: function() {
        var demo = this.isDemo();

        var url = demo ? '/v3/demo/symbols/' : '/v3/real/symbols/';
        return url;
    },

    _initDialog: function() {
        this.delDialog = new Dialog({
          isShow: false,
          confirmAndClose: true,
          tmpl: this.delTmpl,
          confirmCallback: $.proxy(this._removeFav, this)
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
          el: this.contentEl,
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
          }
        });
    },

    _initFlipsnap: function(maxPoint) {
        this.flipsnap = Flipsnap('.flipsnap');
        window.flipsnap = this.flipsnap;
    },

    _initTopbar: function(e) {
        var q = new Uri().getParam('q');

        if (q !== undefined) {
            this.headerEl.addClass('unfold');
        }
    },

    attrs: {
        headerEl: $('#J_Header'),

        listEl: $('#J_List'),

        navListEl: $('#J_NavList'),

        contentEl: $('#J_Container'),

        emptyTmpl: '<li class="empty">你还没有交易信息</li>',

        tmpl: [
            '<% $.each(data, function(index, item) {%>',
            '    <li class="J_Type">',
            '        <span class="link" data-category="<%= item.name %>"><%= item.desc %></span>',
            '    </li>',
            '<% }); %>'
        ].join(''),

        contentTmpl: [
            '<% $.each(data, function(index, item) {%>',
            '    <ul class="clearfix cat-wrapper J_List" style="display:none"></ul>',
            '<% }); %>'
        ].join(''),

        delTmpl: [
          '<div class="dialog J_Dialog dialog-trade del-dialog " id="J_Dialog">',
          '   <span class="wrapper-icon"><span class="icon"></span></span>',
          '   <div class="dialog-content J_Content">',
          '        <p class="title">确认删除自选</p>',
          '   </div>',
          '   <div class="dialog-buttons clearfix">',
          '       <span class="dialog-btn J_DialogClose">取消</span>',
          '       <span class="dialog-btn J_DialogConfirm">删除</span>',
          '   </div>',
          '</div>',
          '<div class="dialog-mask J_DialogMask"></div>'
        ].join('')
    }
});

new Cat();