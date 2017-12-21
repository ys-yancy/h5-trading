var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var Banner = require('../../common/banner/index');
var Uri = require('../../app/uri');
var Cookie = require('../../lib/cookie');
var Flipsnap = require('../../lib/flipsnap');
var CustomerService = require('../../common/customer-service'); 

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
        this._requires();
        this._getData();
        this.configStatistics();
    },

    _bind: function() {
        var doc = $(document),
            formEl = $('#J_Form');

        doc.on('tap', '.J_OpenSearch', $.proxy(function(e) {
            this.headerEl.addClass('unfold');
        }, this));

        doc.on('tap', '.J_CloseSearch', $.proxy(function(e) {
            this.headerEl.removeClass('unfold');
        }, this));

        doc.on('tap', '.J_Type', $.proxy(this._select, this));

        formEl.on('submit', $.proxy(this._search, this));

        // 添加默认微信分享
        if (this.isWeixin()) {
          this.setupWeiXinShare('default_invite');
        }
    },

    _requires: function() {
        var bannerEl = $('#J_Banner');

        if (bannerEl.length) {
            new Banner({
                el: $('#J_Banner')
            });
        }
        // new CustomerService();
    },

    _select: function(e) {
        var curEl =$(e.currentTarget);
        var index = curEl.index();
        // flipsnap.toNext();
        //flipsnap.toPrev();
        // this.flipsnap.moveToPoint(index < 3 ? 0 : index - 5);
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
            self.render(self.contentTmpl, data.data, self.contentEl);
            self._initFlipsnap(parseInt(data.data.length / 2));
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

        location.href = './list.html?kw=' + encodeURIComponent(val);
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

        contentEl: $('.content'),

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
        ].join('')
    }
});

new Cat();