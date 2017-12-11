var Util = require('../../app/util');
var Config = require('../../app/config');

module.exports = {
    shouldChartUpdate: function(priceInfo) {
        var type = this.candleType;

        if (!priceInfo.received_time) {
            return;
        }
        var receiveTime = Util.getTime(priceInfo.received_time);

        if (receiveTime === this.receiveTime) {
            return;
        }

        this.receiveTime = receiveTime;
        var interval = 60;

        switch (type) {
            case 'm1':
                interval = 60;
                break;
            case 'm5':
                interval = 60 * 5;
                break;
            case 'm15':
                interval = 60 * 15;
                break;
            case 'm30':
                interval = 60 * 30;
                break;
            case 'h1':
                interval = 60 * 60;
                break;
            case 'd1':
                interval = 60 * 60 * 24;
                break;
        }

        // console.log(receiveTime % (1000 * interval) , Config.getInterval())

        if (receiveTime % (1000 * interval) >= Config.getInterval()) {
            return;
        }

        console.log(true);

        self.chart = null;
        this._getCandle(type, true);
    }
}