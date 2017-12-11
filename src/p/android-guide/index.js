"use strict";

var PageBase = require('../../app/page-base');
var Cookie = require('../../lib/cookie');

class AndroidGuide extends PageBase {
    constructor() {
        super();

        this._bind();
        this._resize();
        this.configStatistics();

        /*
        if (Cookie.get('phone') && Cookie.get('token')) {
            window.location = './option.html'; 
        }
        */
    }

    _bind() {
        var doc = $(document);

        // doc.on('tap', '.J_Login', $.proxy(this._login, this));
        doc.on('click', '.J_Register', $.proxy(this._register, this));
    }

    _login() {
        this.login().then(function() {
            location.href = './option.html';
        }.bind(this));
    }

    _register(e) {
        var curEl = $(e.currentTarget);

        curEl.attr('href', './register.html?from=guide&src=' + encodeURIComponent(location.href));
    }


    _resize() {
        var winHeight = $(window).height(),
            hdEl = $('.hd'),
            contentEl = $('.action-wrapper'),
            ftEl = $('.ft'),
            referEl = $('.annoymous');

        var height = winHeight - hdEl.height() - ftEl.height();
        var ratio = winHeight / 1134;
        var dpr = $('html').attr('data-dpr');

        if (ratio < 1) {
            var hdMarginTop = 186 * ratio / dpr;
            var contentMarginTop = 282 * ratio / dpr;
            hdEl.css('margin-top', hdMarginTop);
            contentEl.css('margin-top', contentMarginTop);
            ftEl.css('bottom', 16 * ratio / dpr);

            var ftOffsetTop = ftEl.offset().top;
            var referTop = referEl.offset().top + referEl.height();
            var next = true;

            while (ftOffsetTop < referTop && next) {
                setStyle();
                ftOffsetTop = ftEl.offset().top;
                referTop = referEl.offset().top + referEl.height();
            }
        }

        function setStyle() {
            hdMarginTop -= 20 * 186 / 282;
            contentMarginTop -= 20;

            if (hdMarginTop < 0 || contentMarginTop < 0) {
                next = false;
                return;
            }

            hdEl.css('margin-top', hdMarginTop);
            contentEl.css('margin-top', contentMarginTop);
        }
    }
}

new AndroidGuide();