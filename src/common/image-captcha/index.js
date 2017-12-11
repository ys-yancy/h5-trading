"use strict";
require('./index.css');
var Base = require('../../app/es6-base');
var tmpl = require('./index.ejs');

export default class ImageCaptcha extends Base {
    constructor() {
        super();

        this._render();
        this._initAttrs();
        this._bind();
    }

    _bind() {

        var doc = $(document);

        doc.on('tap', '.get-captcha', $.proxy(this._submit, this));
        doc.on('tap', 'img.captcha', $.proxy(this._show, this));
        doc.on('tap', '.close-captcha', $.proxy(this._hide, this));        
        // this.el.on('touchend', $.proxy(this._end, this));
        // this.el.on('click', $.proxy(this._click, this));
    }

    _move(e) {
        var x = e.changedTouches[0].clientX;
        var y = e.changedTouches[0].clientY;

        x = x - this.width / 2;

        this.el.css({
            left: x < -this.width / 2 ? -this.width / 2 : x,
            top: y - this.height / 2
        })
        e.preventDefault();
        // e.stopPropogation();
    }

    _click() {
        location.href = './cs.html?src=' + encodeURIComponent(location.href);
    }

    _render() {
        this.renderTo(tmpl, {}, $('.code-wrapper'));
    }

    _initAttrs() {
        this.el = $('#J_ImageCaptcha');
        this.width = this.el.width();
        this.height = this.el.height();
        this.captchaVal = '';
    }

    _submit () {
       var captInput = $('#J_ImageCaptcha .captcha-text' );
       if (captInput.val()) {
          this.captchaVal = captInput.val();
          $('#J_ImageCaptcha .wrapper').addClass('success');
       }
       //console.log ('submit captcha =' + captInput.val());
    }

    _show() {
        $('#J_ImageCaptcha').show();

        // var tel = '13810157999'; 
        var tel = $('.tel').val();
        var getCodeEl = $('.get-captcha');

        this.ajax({
          url: '/v1/imagevcode/' + tel,
          type: 'get',
          data: {
            _t: Math.random()
          }
        }).then(function(data) {
            $('.get-captcha').removeClass('disable');
            $('.captcha')[0].src = data.data;
        });
    }

    _hide() {
        $('#captcha-message').html('');
        $('#J_ImageCaptcha .captcha-text').val('');
        $('#J_ImageCaptcha').hide();
        $('.get-captcha').addClass('disable');
    }

    _refresh() {
        // var tel = '13810157999'; 
        var tel = $('.tel').val();
        var getCodeEl = $('.get-captcha');

        this.ajax({
          url: '/v1/imagevcode/' + tel,
          type: 'get',
          data: {
            _t: Math.random()
          }
        }).then(function(data) {
            $('.get-captcha').removeClass('disable');
            $('.captcha')[0].src = data.data;
        });
    }

    _getCaptcha() {
        return this.captchaVal;
    }

    _changeClass(c) {
        // 为 guides 页面定制
        if (c == 'guides') {
            $('#J_ImageCaptcha').addClass('image-captcha-guides');
            $('#J_ImageCaptcha .wrapper').removeClass('wrapper');
        }
        else if (c == 'tycoon') {
            $('#J_ImageCaptcha').removeClass('image-captcha');
            $('#J_ImageCaptcha').addClass('image-captcha-tycoon');
            $('#J_ImageCaptcha .wrapper').removeClass('wrapper');
        }
        else if (c == 'haoxin') {
            $('#J_ImageCaptcha').removeClass('image-captcha');
            $('#J_ImageCaptcha').addClass('image-captcha-haoxin');
            $('#J_ImageCaptcha .wrapper').removeClass('wrapper');
        }
        else if (c == 'xwjr') {
            $('#J_ImageCaptcha').removeClass('image-captcha');
            $('#J_ImageCaptcha').addClass('image-captcha-xwjr');
            $('#J_ImageCaptcha .wrapper').removeClass('wrapper');
        }
        else if (c == 'tts') {
            $('#J_ImageCaptcha').removeClass('image-captcha');
            $('#J_ImageCaptcha').addClass('image-captcha-tts');
            $('#J_ImageCaptcha .wrapper').removeClass('wrapper');
        }
        else if (c == 'fxbtg') {
            $('#J_ImageCaptcha').removeClass('image-captcha');
            $('#J_ImageCaptcha').addClass('image-captcha-fxbtg');
            $('#J_ImageCaptcha .wrapper').removeClass('wrapper');
        }

    }
}