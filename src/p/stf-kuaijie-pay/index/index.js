var Base = require('../../../app/base');
var Cookie = require('../../../lib/cookie');
var Validate = require('../common/validate');
var ShowError = require('../common/showError');
function StfKuaijieDefaultPay() {
    StfKuaijieDefaultPay.superclass.constructor.apply(this, arguments);
    this._init();
}

Base.extend(StfKuaijieDefaultPay, Base, {
    mix: [Validate, ShowError],
    _init() {
        console.log(this)
    },

    _bind() {
        
    }
});

new StfKuaijieDefaultPay();