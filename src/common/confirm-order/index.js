'use strict';

import Base from '../../app/base';
import Dialog from '../dialog';

export default class ConfirmOrder extends Base{
    constructor(config) {
        super(config);

        this._initDialog();
    }

    _initDialog() {
        this.confirmDialog = new Dialog({
            isShow: false,
            tmpl: this.tmpl,
            confirmCallback: $.proxy(function() {
                this.fire('confirm:order');
            }, this)
        })
    }

    show() {
        this.confirmDialog.show(); 
    }

    hide() {
        this.confirmDialog.hide(); 
    }

    defaults() {
        return {
            tmpl: `<div class="dialog dialog-confirm-order" id="J_Dialog">
                   <span class="wrapper-icon"><span class="icon"></span></span>
                   <div class="dialog-content J_Content">
                       <p class="title">提示</p>
                       <div class="desc">您确定要执行该操作吗？</div>
                   </div>
                   <div class="dialog-buttons clearfix">
                       <span class="dialog-btn J_DialogClose">取消</span>
                       <span class="dialog-btn J_DialogConfirm">确定</span>
                   </div>
                </div>
                <div class="dialog-mask J_DialogMask"></div>`,
        }
    }
}