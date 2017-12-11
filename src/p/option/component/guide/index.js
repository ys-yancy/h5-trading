'use strict';

var Base = require('../../../../app/base');
var Util = require('../../../../app/util');
var Cookie = require('../../../../lib/cookie');
var tmpl = require('./index.ejs');
var step2Tmpl = require('./step2.ejs');
var step3Tmpl = require('./step3.ejs');
var step4Tmpl = require('./step4.ejs');

class Guide extends Base {
  constructor() {
    super();

    if (!getUseNewGuide() || Cookie.get('new')) {
      return;
    }

    Cookie.set('new', '1');

    this.el = this.renderTo(tmpl, {}, $('body'));

    this._bind();
  }

  _bind() {
    this.el.on('click', '.J_Close', (e) => {
      this.el.hide();
    });

    this.el.on('click', '.J_Confirm', (e) => {
      e.stopPropagation();
      if (this.onCheck) {
        return;
      }
      this.onCheck = true;
      this._check();
    });

    this.el.on('click', (e) => {
      if ($(e.target).hasClass('inner-1')) {
        return;
      }
      this.el.remove();
    })

    this.el.on('click', '.J_GuideMask', (e) => {
      this.el.hide();
    })
  }

  _check() {
    var check_symbol = this._checkSymbol();
    this.ajax({
      url: '/v1/symbol/closeprice/',
      data: {
        symbols: check_symbol.checkSymbol
      }
    }).then((data) => {
      data = data.data;
      var allClose = true;
      var time = Date.now();
      var symbolOption = [];
      var symbolStatus = {};

      _.each(data.close_time, (item, key) => {
        var closeTime = item[0];
        // var closeTime = symboVal.close_time[0];
        var symbolVal = {
          symbol: key
        };

        if (closeTime && time < Util.getTime(closeTime.end) && time > Util.getTime(closeTime.start)) {
          symbolVal.close = true;
        } else {
          symbolVal.close = false;
          allClose = false;
        }

        symbolOption.push(symbolVal);
        symbolStatus[key] = symbolVal.close;
      });


      return {
        allClose: allClose,
        symbol: symbolOption,
        symbolStatus: symbolStatus
      };
    }).then((data) => {

      this.el.remove();

      if (data.allClose) {
        this.el3 = this.renderTo(step3Tmpl, {}, $('body'));

        this.el3.on('click', (e) => {
          var targetEl = $(e.target);

          if (targetEl.parents('.bg-inner').length !== 0 || targetEl.hasClass('bg-inner') || targetEl.hasClass('list') || targetEl.parents('.list').length !== 0) {
            return;
          }

          this.el3.remove();
        })


        return;
      }
      

      this.el2 = this.renderTo(check_symbol.step_tmpl, data, $('body'));

      this.el2.on('click', (e) => {
        if ($(e.target).parents('.list').length === 0) {
          this.el2.remove();
        }
      });
      this.el2.on('click', 'a', (e) => {
        if ($(e.currentTarget).hasClass('status-close')) {
          e.preventDefault();
        }
      });



    });
  }

  _checkSymbol() {
    var step_tmpl = step2Tmpl;
    var checkSymbol = ['CN.SGX.MINI', 'XAUUSD.MINI', 'XTIUSD', 'USDCNH'].join(',');
    
    if (getWXWL() == 'tycoon') {
      step_tmpl = step4Tmpl;
      checkSymbol = ['XAGUSD.MINI', 'XAUUSD.MINI', 'XTIUSD', 'USDJPY'].join(',')
    } 

    return {
      step_tmpl: step_tmpl,
      checkSymbol: checkSymbol
    }
  }
}

new Guide();