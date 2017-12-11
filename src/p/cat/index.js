var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var Banner = require('../../common/banner/index');
var Uri = require('../../app/uri');
var Cookie = require('../../lib/cookie');
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

    _getData: function() {
        var self = this,
            token = Cookie.get('token');

        this.ajax({
            url: '/v1/symbol/category/',
            data: {
                access_token: token
            }
        }).then(function(data) {
            self.render(self.tmpl, data.data, self.listEl);
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

    _initTopbar: function(e) {
        var q = new Uri().getParam('q');

        if (q !== undefined) {
            this.headerEl.addClass('unfold');
        }
    },

    attrs: {
        headerEl: $('#J_Header'),

        listEl: $('#J_List'),

        tmpl: [
            '<% $.each(data, function(index, item) {%>',
            '    <li>',
            '        <a class="link" href="./list.html?category=<%= item.name %>&title=<%= encodeURIComponent(item.desc) %>"><%= item.desc %></a>',
            '    </li>',
            '<% }); %>'
        ].join('')
    }
});

new Cat();