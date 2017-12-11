var Config = require('./config');


module.exports = {

    baiduCode: getBaiduCodeScript(),

    // ANDROID没做统计代码暂时用百度
    // ymCode: '<script></script>',
    ymCode: "<script>var path = window.location.pathname;path = path.substring(path.lastIndexOf('/')+1, path.lastIndexOf('.'));window.tracker.onPageEnter(path);document.getElementsByTagName('body')[0].onunload = function() {var path = window.location.pathname;path = path.substring(path.lastIndexOf('/')+1, path.lastIndexOf('.'));window.tracker.onPageLeave(path);}</script>",
    // ymCode: "<script>var path = window.location.pathname;path = path.substring(path.lastIndexOf('/')+1, path.lastIndexOf('.'));window.tracker.onPageEnter(path);</script>",
    
    invheroXinwaihuiCode: "<script>var _hmt = _hmt || [];(function() {var hm = document.createElement('script');hm.src = '//hm.baidu.com/hm.js?88277d3fbca502c32b4041e7feb036fb';var s = document.getElementsByTagName('script')[0];s.parentNode.insertBefore(hm, s);})();</script>",

    _getStatisticCode: function() {
        if (Config.isAndroidAPK()) {
            return this.ymCode;
        }
        else {
            if (location.href.indexOf('xinwaihui') != -1) {
                return this.invheroXinwaihuiCode;
            }
            else {
                return this.baiduCode;
            }
        }
    },

    /**
     * 根据config.isAndroidAPK判断使用什么统计代码, 并植入到html页面特定位置
     * 
     */

    configStatistics: function() {
        $('head').append(this._getStatisticCode());
    }
}