"use strict";
require('./index.css');
var Base = require('../../app/es6-base');
var Cookie = require('../../lib/cookie');
var tmpl = require('./index.ejs');
var Config = require('../../app/config');

export default class LiveSpeech extends Base {
    constructor() {
        super();
        this._initAttrs();
        this._render();
        this._bind();
    }

    _bind() {
        // this.el.on('dragstart', $.proxy(this._dragstart, this));
        // this.el.on('drag', $.proxy(this._drag, this));
        if (this.el) {
            this.el.on('touchmove', $.proxy(this._move, this));
            // this.el.on('touchend', $.proxy(this._end, this));
            this.el.on('click', $.proxy(this._click, this));
        }
    }

    // 移动直播按钮
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

    // 点击直播按钮干什么
    _click() {
        // on 状态需要关闭
        if (this.status == 'on') {
            if (Config.isAndroidAPK()) {
                window.play&& window.play.endPlay();
            }
            else {
                $('#J_LsSrc')[0].pause();
                $('#J_LsSrc')[0].src = '';
            }
            this.status = 'off';
            Cookie.set('live_status', 'off');

            // 切换图片状态
            $('#J_LsSrc')[0].parentElement.className = 'live-off';
            $('#J_LsSrc')[0].nextElementSibling.innerHTML = '有直播';
        } 
        // off 状态需要开启
        else if(this.status == 'off') {
            if (Config.isAndroidAPK()) {
                window.play&& window.play.startPlay(this.url);
            }
            else {
                $('#J_LsSrc')[0].src = this.url;
                $('#J_LsSrc')[0].play();
            }
            
            this.status = 'on';
            Cookie.set('live_status', 'on');

            // 切换图片状态
            // 切换图片状态
            $('#J_LsSrc')[0].parentElement.className = 'live-on';
            $('#J_LsSrc')[0].nextElementSibling.innerHTML = '直播中';
        }
    }

    // 渲染
    _render() {
        // 显示入口的条件: 1.当前为播放状态; 2.当前时间处于直播开始和结束之间;
        if ((window.location.href.indexOf('pro-trading') != -1 || this.status == 'on')
                && Date.now() >= this.start_time && Date.now() <= this.end_time) {
            this.renderTo(tmpl, {status: this.status}, $(document.body));

            this.el = $('#J_LiveSpeech');
            this.width = this.el.width();
            this.height = this.el.height();

            // 需要启动直播
            if (this.status == 'on' && Date.now() >= this.start_time && Date.now() <= this.end_time) {
                if (Config.isAndroidAPK()) {
                    window.play&& window.play.startPlay(this.url);
                }
                else {
                    $('#J_LsSrc')[0].src = this.url;
                    $('#J_LsSrc')[0].play();
                }
                
                this.status = 'on';
                Cookie.set('live_status', 'on');

                $('#J_LsSrc')[0].parentElement.className = 'live-on';
                $('#J_LsSrc')[0].nextElementSibling.innerHTML = '直播中';
            }
        }
    }

    _initAttrs() {
        
        // 直播状态 on:正在直播 off:没有直播
        this.status = Cookie.get('live_status') || 'off';

        // 当前直播地址
        this.url = Cookie.get('live_url') || '';

        // 直播开始时间
        var s = Cookie.get('live_start');
        if (s != '' && s != undefined)
            this.start_time = Date.parse(s.replace(/-/g,'/'));
        else 
            this.start_time = '';

        // 直播结束时间
        s = Cookie.get('live_end');
        if (s != '' && s != undefined)
            this.end_time = Date.parse(s.replace(/-/g,'/'));
        else 
            this.end_time = '';

        // alert('live_start=' + Cookie.get('live_start') + ' start_time=' + this.start_time);

    }

}