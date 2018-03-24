var Base = require('../../../../app/base');
var Uri = require('../../../../app/uri');
var Cookie = require('../../../../lib/cookie');
var tmpl = require('./index.ejs');

export default class DepositBonus extends Base {
    constructor(config) {
        super(config);

        this._getData();
    }

    _getData() {
        var self = this;
        this.ajax({
            url: '/v1/deposit_bonus/config',
            data: {
                access_token: this.cookie.get('token')
            }
        }).then(function(data) {
            var config = data.data.config;
            var params = config.deposit_bonus.real;

            if(params.ratio[0].ratio!==0 || params.ratio[1].ratio!==0 || params.ratio[2].ratio!==0 ){
                self.render(tmpl, params, self.el);
            }
            depositBonus = params.ratio.sort(function(val1, val2) {
                if (val1.limit > val2.limit) {
                    return -1;
                } else if (val1.limit === val2.limit) {
                    return 0;
                } else {
                    return 1;
                }
            });

            this.fire('get:depositBonus', depositBonus);
        });
    }
}