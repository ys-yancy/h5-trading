var Cookie = require('../lib/cookie');
var Util = require('./util');

var ua = navigator.userAgent;

var config = {

  demo: 1000, // demo时，价格刷新频率
  real: 500, // 实盘，价格刷新频率

  candle: {
    demo: 60 * 1000, // demo时，蜡烛图刷新频率
    real: 30 * 1000 // 实盘时，蜡烛图刷新频率
  },

  originRateOne: 20 * 60, //单位 s, 保证金比例弹框过期时间

  originRateTwo: 60 * 60 * 12, //单位 s, 保证金比例弹框过期时间

  realPassword: 60 * 60, // 单位 s,  实盘过期时间

  orderShare: 3 * 60, // 单位 s, 分享订单匿名token的过期时间

  rankEquityThreshold: 500, // 榜单的初始净值

  // ajax请求前缀

  // 正式环境
  ajaxPrefix: getFormalEnvironmentUrl(),

  // 测试环境
  // ajaxPrefix: 'http://210.72.229.191:8100',

  // 测试环境
  // ajaxPrefix: 'http://192.168.0.204:8999',

  // 邀请链接
  invitePrefix: getInviteUrl(),

  // 是否为Android客户端
  isAndroidAPK: false,

  // H5版本代号
  version: '0220',

  // 是否为Android手机
  isAndroid: ua.match(/(Android);?[\s\/]+([\d.]+)?/), //true,

  // Android分享前缀
  androidSharePrefix: getAndroidSharePrefixUrl(),

  // 生产服默认 APPID
  appid: 'wxf587c0d17e265b55',

  // 测试服默认 APPID
  // appid: 'wxafcdbe314008a384',

  isAppid :'',

  // 杠杆使用率
  lever: 40,

  //滑动验证nc_appkey
  nc_appkey: 'FFFF00000000016863B4',

  // 目标盈利 与 投资额度关系  目标盈利 = 投资额度 * profitIndex
  profitIndex: 1,

  // 24交易ui默认配置可用保证金
  freeMargin: 15,

  // 广播时间与参数配置
  broadcast: {
    option: {
      tags: 'option',
      // tags: 'recommend',
      interval: 60 * 1000, // 控制接口的间隔时间

      speed: 10, // 每秒滚动10像素
      // duration: 4000
      slideInterval: 12 * 1000 // 间隔 控制的是停留时间
    },

    trade: {
      tags: 'trade',
      interval: 5 * 1000,
      // duration: 4000

      speed: 5,
      slideInterval: 12 * 1000 // 间隔
    },

    proTrading: {
      tags: 'pro-trading',
      interval: 5 * 1000,

      speed: 3,
      slideInterval: 12 * 1000 // 间隔

      // duration: 4000
    },

    order: {
      tags: 'order',
      interval: 5 * 1000,

      speed: 1,
      slideInterval: 12 * 1000 // 间隔
    }
  },

  // 步长
  step: 5,

  rapidDefaultInv: 5, // rapid 默认交易量

  cacheTime: 100, // 价格缓存时间
  openCache: location.pathname.indexOf('option.html') !== -1 || location.pathname.indexOf('trade-history.html') !== -1, // 是否开启价格缓存


  expiredTime: 30 * 1000, // 价格30s过期

  commissionRate: 0.15, // 佣金比例, 需要后台配置计算好
  //defaultRapidSymbols: ['XTIUSD.MICRO', 'XAUUSD.MICRO', 'XAGUSD.MICRO', 'EURUSD.MICRO', 'GBPUSD.MICRO'] // rapid 默认品种
  defaultRapidSymbols: getDefaultRapidSymbols()
};



module.exports = {
  getOrderShareAnonymousTokenExpireTime: function() {
    return config.orderShare;
  },

  getInterval: function() {
    if (Cookie.get('type') === 'demo') {
      return config.demo;
    }

    return config.real;
  },

  getCandleExpireTime: function() {
    if (Cookie.get('type') === 'demo') {
      return config.candle.demo;
    }

    return config.candle.real;
  },
  getRealPasswordExpireTime: function() {
    return config.realPassword;
  },
  getOriginRateOneExpireTime: function() {
    return config.originRateOne;
  },


  getOriginRateTwoExpireTime: function() {
    return config.originRateTwo;
  },

  getAjaxPrefix: function() {
    // return config.ajaxPrefix;
    // 这样就不需要总是在提交的时候来回改了。;
    var dev = 'http://45.121.52.91:8100';
    // var dev = 'http://api-normal.thetradestar.com';

    var prod = getProduClothedUrl();
    return prod;
    if (window.location.host.indexOf('my.h5') !== -1) {
      return dev;
    } else if (window.location.origin == 'file://')
      return prod;
    if (window.location.hostname == 'waibao.invhero.com')
      return dev;
    if (window.location.hostname == '45.121.52.91')
      return dev;
    if (window.location.hostname == 'localhost')
      return dev;
    if (window.location.hostname == '192.168.199.127')
      return dev;
    if (window.location.hostname == '127.0.0.1')
      return dev;
    if (window.location.hostname == '192.168.0.178')
      return prod;
    return prod;
  },

  getInvitePrefix: function() {
    return config.invitePrefix;
  },

  isAndroid: function() {
    return config.isAndroid;
  },

  isAndroidAPK: function() {
    return config.isAndroidAPK;
  },

  getAppid: function() {
    return config.appid;
  },

  getAndroidSharePrefix: function() {
    return config.androidSharePrefix;
  },

  getAvatarPrefix: function(src) {
    if (src.indexOf('http') == 0) {
      return src;
    } 
    else if (Util.isDaily()) {
      return this.getAjaxPrefix() + src;
    }
    else {
      if (this.isAndroidAPK()) {
        return getAndroidAvatarUrl() + src.slice(7)
      } else {
        return getNativePlaceUrl() + src.slice(7)
      }
    }
  },

  getLever: function() {
    return config.lever;
  },

  getProfitIndex: function() {
    return config.profitIndex;
  },

  getFreeMargin: function() {
    return config.freeMargin;
  },

  getBroadcastConfig: function(type) {
    return config.broadcast[type];
  },

  getRankEquityThreshold: function() {
    return config.rankEquityThreshold;
  },

  getStep() {
    return config.step;
  },

  getStepX() {
    return 5;
  },

  getVersion() {
    return config.version;
  },

  getExpiredTime() {
    return config.expiredTime;
  },

  getConmissionRate() {
    return config.commissionRate;
  },

  // 开启缓存
  openCache() {

    return config.openCache;
  },

  getCacheTime() {
    return config.cacheTime;
  },

  getRapidDefaultInv() {
    return config.rapidDefaultInv;
  },

  getDefaultRapidSymbols() {
    return config.defaultRapidSymbols;
    // return getDefaultRapidSymbols();
  },

  getAliyunAppkey() {
    return config.nc_appkey;
  }

};
