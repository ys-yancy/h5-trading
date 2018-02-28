'use strict';
import Base from '../../../app/base';
import Config from '../../../app/config';
import Cookie from '../../../lib/cookie';

// 引入的是master-list中的chart组件
// import CreateMiniChart from '../../master-list/chart/mini-line';

import tmpl from './index.ejs';

export default class MainMasters extends Base {
    constructor(config) {
        super(config);

        this._getData();
    }

    _getData() {
        this.ajax({
            url: '/v1/follow/rank/expert/profit/yield_rate/',
            data: {
                access_token: Cookie.get('token')
            }
        }).then((data) => {
            data = data.data;

            if (data.length > 5) {
                data.length = 5;
            }

            data = data.map((item) => {
                item.img = item.img ? Config.getAvatarPrefix(item.img) : getDefaultIconWL();
                return item;
            })
        
            this.render(tmpl, data, this.el);
            // this._renderCharts(data);
        }) 
    }

    _renderCharts(data) {
        var chartWraperEls = $('.J_TradelistChart', this.el);

		for ( var i = 0, len = data.length; i < len; i++ ) {
			var list = [], profitList = data[i].profit_history || [];
			var chartWraperEl = chartWraperEls[i];
     
			for ( var j = 0, le = profitList.length; j < le; j++ ) {
                if (!isNaN(parseFloat(profitList[j].amount))) {
                    list.push(parseFloat(profitList[j].amount))
                }
			}
			new CreateMiniChart({
				el: chartWraperEl,
			    chartName: 'trade-list-charts-rate',
			    data: list
			})
		}
    }
}