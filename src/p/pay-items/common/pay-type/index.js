"use strict";

var Base = require('../../../../app/base');
var Uri = require('../../../../app/uri');
var tmpl = require('./index.ejs');
export default class PayType extends Base {
    constructor(config) {
        super(config);

        this.render();
    }

   render() {
        this.renderTo(tmpl, getShowPayWay(), this.el);
   }
}