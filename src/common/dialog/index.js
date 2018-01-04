/**
 * 弹层组件
 */
"use strict";
import './index.css';
import Base from '../../app/base'

export default class Dialog extends Base{
    constructor(config) {
        super(config, 'dialog');
        this.init();
    }

    init() {
        this._render();
        this._bind();
    }

    _bind() {
        let diaMaskEl = this.el.next('.J_DialogMask');

        this.el.on('click', '.J_DialogClose', $.proxy(this.close, this));
        this.el.on('click', '.J_DialogConfirm', $.proxy(this.confirm, this));

        diaMaskEl.on('touchmove', function(e) {
            e.preventDefault();
        });
    }

    show(options) {
        let maskEl = this.el.next('.J_DialogMask');
        $('.dialog-btn', this.el).removeClass('active');
        window.scrollTo(0, 0);
        maskEl.show();
        this.el.show();
    }

    close(e, fromConfirm) {
        let curEl = $(e.currentTarget);

        this.hide();
        e.preventDefault();

        if (!fromConfirm) {
            this.callback && this.callback();
        }

        this.cancleCallback && this.cancleCallback(curEl);
    }

    confirm(e) {
        let curEl = $(e.currentTarget);

        if (this.confirmAndClose) {
            this.hide({}, true);
        }
        this.confirmCallback && this.confirmCallback(curEl);
    }

    hide() {
        this.el.hide();

        $('.J_DialogMask').hide();
    }

    setContent(val) {
        let contentEl = $('.J_Content', this.el);

        contentEl.html(val);
    }

    // 设置按钮文案
    setBtn(text, callback) {
        if (!text) {
            return;
        }
        $('.J_DialogClose', this.el).text(text);

        if (callback && $.isFunction(callback)) {
            this.callback = callback;
        }
    }

    _render() {
        var html = $(this.tmpl);

        $(document.body).append(html);

        this.el = $(html[0]);

        if (!this.isShow) {
            this.hide();
            return;
        }

        window.scrollTo(0, 0);

    }

    destroy() {
        let diaMaskEl = this.el.next('.J_DialogMask');
        this.el.remove();
        this.el.off('click', '.J_DialogClose', $.proxy(this.close, this));
        this.el.off('click', '.J_DialogConfirm', $.proxy(this.confirm, this));
        diaMaskEl.off('touchmove', function(e) {
            e.preventDefault();
        });
    }

    defaults() {
        return {
            content: '',

            btnContent: '我知道了',

            // 关闭弹层
            confirmAndClose: false,

            cancelCallback: function() {},

            confirmCallback: function() {},

            tmpl: [
                '<div class="dialog J_Dialog" id="J_Dialog">',
                '   <div class="dialog-title"><%= data.title %></div>',
                '   <div class="dialog-content J_Content"><%= data.content %></div>',
                '   <div class="dialog-buttons">',
                '       <span class="dialog-btn J_DialogClose" data-idx="alert0"><%= data.btnContent %></span>',
                '   </div>',
                '</div>',
                '<div class="dialog-mask J_DialogMask"></div>'
            ].join('')
        }
    }
}