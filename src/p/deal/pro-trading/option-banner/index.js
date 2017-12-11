"use strict";

// require('./index.css');
var PageBase = require('../../../../app/page-base');
var tmpl = require('./index.ejs');


export default class OptionBanner extends PageBase {
    constructor(config) {
        super(config);


        this._setHeight();
        this._getOption();
        this._bind();
    }

    _bind() {
        var doc = $(document);

        $('.J_OptionFold').on('click', $.proxy(this._fold, this));
        $('.J_OptionBannerMask').on('click', $.proxy(this._fold, this));

        this.el.on('click', '.J_AddOption', $.proxy(this._add, this));
        this.el.on('click', '.J_DelOption', $.proxy(this._del, this));
        this.el.on('click', '.item.first', $.proxy(this._action, this));
        this.el.on('click', '.J_Del', $.proxy(this._showDel, this));

        document.addEventListener('touchstart', function() {}, true);

        this.subscribe('action:option:success', this._success, this);
    }

    _del(e) {
        e.stopPropagation();
        this.broadcast('action:option', {
            add: false
        });
    }

    _add(e) {
        e.stopPropagation();
        this.broadcast('action:option', {
            add: true
        });
    }

    _showDel(e) {
        var curEl = $(e.currentTarget);
        var parentEl = curEl.parent();

        parentEl.toggleClass('active');
    }

    _action(e) {
        var curEl = $(e.currentTarget);

        if (curEl.hasClass('active')) {
            curEl.removeClass('active');
        }
    }

    _success() {
        var delEl = $('.J_Del', this.el);

        delEl.toggleClass('add');

        $('.action-wrapper', this.el).toggleClass('action-add');
    }

    _setHeight() {
        var height = $(window).height();

        this.el.height(height);
    }

    _getOption() {
        var token = this.cookie.get('token');

        if (!token) {
            this.el.html('<p class="empty">您还没有添加自选品种</p>');
        }

        var type = this.isDemo() ? 'demo' : 'real';

        this.ajax({
            url: '/v3/' + type + '/symbols6/',
            data: {
                access_token: token
            }
        }).then((data) => {
            data = data.data;

            this.render(tmpl, {
                list: data,
                symbol: this.symbol,
                name: this.name,
                optionAdd: this.optionAdd,
                src: $('#J_NavBack').attr('href')
            }, this.el);

            // $('ul', this.el).prepend($('.J_Current', this.el));
        });
    }

    _fold(e) {
        var bodyEl = $('#J_Page'),
            htmlEl = $('html');

        if (bodyEl.hasClass('move-x')) {
            //htmlEl.removeClass('move-x');
            $('body').removeClass('unfold');


            bodyEl.removeClass('move-x');

            $('.J_OptionBannerMask').hide();
            bodyEl.css({
                height: 'auto',
                // overflow: 'auto'
            });

        } else {
            $('body').addClass('unfold');
            //htmlEl.addClass('move-x');

           // setTimeout(() => {
                bodyEl.addClass('move-x');

                bodyEl.css({
                    height: $(window).height(),
                  //  'overflow': 'hidden'
                });
                $('.J_OptionBannerMask').show();
            //}, 150);

        }
    }

    _preventTouch(e) {
        e.preventDefault();
    }
}