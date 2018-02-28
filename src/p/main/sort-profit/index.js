'use strict';
import Base from '../../../app/base';
import Config from '../../../app/config';
import Cookie from '../../../lib/cookie';

import tmpl from './index.ejs';

export default class SortProfit extends Base {
    constructor(config) {
        super(config);

        this._getData();
    }

    _getData() {
        this.ajax({
            // 15: 最近15个自然日
            // 10: 一次返回10个人
            url: '/v1/rank/user_profit/15/10',
            data: {
                wl: getWXWL()
            }
        }).then((data) => {
            data = data.data;

            data = data.map((item) => {
                item.img = item.img ? Config.getAvatarPrefix(item.img) : getDefaultIconWL();
                return item;
            })
            
            console.log(data)
            this.render(tmpl, data, this.el);
        }) 
    }
}