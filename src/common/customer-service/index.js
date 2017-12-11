"use strict";
require('./index.css');
var Base = require('../../app/es6-base');
var tmpl = require('./index.ejs');

export default class CustomerService extends Base {
    constructor() {
        super();

        this._render();
        this._initAttrs();
        this._bind();
    }

    _bind() {
        // this.el.on('dragstart', $.proxy(this._dragstart, this));
        // this.el.on('drag', $.proxy(this._drag, this));

        this.el.on('touchmove', $.proxy(this._move, this));
        // this.el.on('touchend', $.proxy(this._end, this));
        this.el.on('click', $.proxy(this._click, this));
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
        this.renderTo(tmpl, {}, $(document.body));
    }

    _initAttrs() {
        this.el = $('#J_CustomerService');
        this.width = this.el.width();
        this.height = this.el.height();
    }
}