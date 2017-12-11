'use strict';

var PageBase = require('../../../app/page-base');
var tmpl = require('./index.ejs');
require('./index.css');

export default class Attribute extends PageBase {
  constructor(data) {
    super();

    this._getCommision(data);

    if ((data.policy.category.slice(0, 7) === 'FUTURE_' && data.policy.symbol.indexOf('XNGUSD') == -1) || data.policy.symbol.indexOf('CL.NYMEX') != -1 ) {
      data.future = true;
    }
    // 判断是否是有固定保证金品种
    data.isHasFixedMargin = data.policy.margin_is_fixed == '1' ? true : false;

    this.renderTo(tmpl, data, $('body'));
    this.el = $('#J_Attribute');

    this._bind();

  }

  _bind() {
    this.el.on('click', '.close', (e) => {
      this.hide();
    });
  }

  hide() {
    this.el.hide();
    $('.J_DialogMask').hide();
  }

  show() {
    window.scrollTo(0, 0);
    this.el.show();
    $('.J_DialogMask').show();
  }

  _getCommision(data) {
    /** 
     * event为on_ticket_open的话，代表同组内的desc是建仓的手续费
     * event为on_ticket_close的话，代表同组内的desc是平仓的手续费
     */
    data.ticketOpen = '0.00';
    data.ticketClose = '0.00';
    var commissions = data.policy.commissions;
    for (var i = 0, len = commissions.length; i < len; i++) {
      if (commissions[i].event === 'on_ticket_open') {
        data.ticketOpen = commissions[i].desc;
      } else if (commissions[i].event === 'on_ticket_close') {
        data.ticketClose = commissions[i].desc;
      }
    }
  }
}