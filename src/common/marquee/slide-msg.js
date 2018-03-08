"use strict";

import Base from '../../app/base';
import Marquee from './index';

export default class SlideMsg extends Base{
    constructor(config) {
        super(config);

        this._getData();
    }
    
    _getData() {
        this.ajax({
          url: '/v1/marquee/',
          data: {
            tags: this.tags + ',' + getWXWL(),
            start: 0,
            end: 10
          }
        }).then((data) => {
            var data = { "status": 200, "lang": "zh-CN", "message": "OK", "data": [{ "repeat": 2, "end": "2017-05-13 10:16:15", "tags": "order,firstbroker,invhero,hdtc,xinwaihui,null,None", "url": "", "interval": 60, "order": 0, "content": "\u5c0f\u63d0\u793a\uff1a\u5206\u4eab\u5b9e\u76d8\u8ba2\u5355\u5230\u670b\u53cb\u5708\uff0c\u62bd\u5b9e\u76d8\u8d44\u91d1\u6700\u9ad8100\u7f8e\u5143", "start": "2016-05-13 10:16:13", "duration": 15, "id": 9 }, { "repeat": 1, "end": "2017-05-12 17:33:09", "tags": "option,order,firstbroker,invhero,hdtc,xinwaihui,null,None", "url": "", "interval": 60, "order": 0, "content": "\u5173\u6ce8\u5fae\u4fe1\u8ba2\u9605\u53f7TZYH168\uff0c\u6bcf\u65e5\u89e3\u76d8+\u5b9e\u76d8\u7ea2\u5305\u798f\u5229", "start": "2016-05-12 17:33:08", "duration": 15, "id": 8 }] }
            if (data.data.length == 0) {
                return;
            }

            this._initMarquee(data)
    
        });
    }

    _initMarquee(data) {
        $('#J_SlideMsg').marquee({
            list: data.data,
            duration: 3 * 1000,
            isBroadcastCallback: true,
            loadBroadcastedCallback: this._broadAfterCalback
        });
    }

    _broadAfterCalback(item, list) {
        var index = item.attr('data-index'),
            repeat = item.attr('data-repeat');
        
        if (!isNaN(repeat) && repeat > 0) {
            repeat--;
            if (repeat < 1) {
                list.splice(index, 1);
                item.remove();
                return;
            }

            item.attr('data-repeat', repeat);
        }
    }
}