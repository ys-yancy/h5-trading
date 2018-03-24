var Base = require('../../app/base');
var Uri = require('../../app/uri');
var Util = require('../../app/util.js');
var Cookie = require('../../lib/cookie');
class MiddlePay extends Base{
    constructor() {
        super();
        this.linkTo();
    }

    linkTo() {
        var self = this;
        this.ajax({
            url: '/v1/user/pay/channel/list/',
            data: {
                access_token: Cookie.get('token'),
                env: 'h5',
                wl: getWXWL()
            }
        }).then(function(data) {
            data = data.data;

            // if (!data || data.length <= 0) {
            //     document.body.innerHTML += self.tmpl;
            //     return;
            // }

            data.push({
                code: "pc-pay", 
                img: 'pc-web.png'
            })

            location.href = './pay-items/'+ data[0].code +'.html?defaultPay=' + data[0].code;
        }) 
    }

    defaults() {
        return {
            tmpl: [
                '<header class="header">',
                    '<div class="header-inner ui common" id="J_Header">',
                        '<a class="go-back ui icon" href="./account.html?"></a>',
                        '<h1>账户入金</h1>',
                    '</div>',
                '</header>',
                '<div class="content">入金通道目前维护中</div>'
            ].join('')
        }
    }
}

new MiddlePay();