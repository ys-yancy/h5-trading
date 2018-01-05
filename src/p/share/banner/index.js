'use strict';

require('./index.css');
var PageBase = require('../../../app/base');
var tmpl = require('./index.ejs');
var Config = require('../../../app/config');
require('../../../common/slider/index');

export default class Banner extends PageBase {
  constructor(config) {
    super(config);
    this._geOwnBanner();
  }

  _geOwnBanner() {
    var self = this;
    this.ajax({
      url: '/v1/user/profile/invite_ads/?',
      data: {
        access_token: Cookie.get('token'),
        wl:  Cookie.get('wl')
      }
    }).then(function(data) {
      if (data.data) {
        var path = getAndroidAvatarUrl() + data.data.substr(8);
        data.data = [path];
        self._renderSlider(data);
      } else {
        self._getConfig();
      }
    }).fail(function() {
      self._getConfig();
    })
  }

  _getConfig() {
    self.ajax({
      url: '/v1/config/banner'
    }).then((data) => {
      this._renderSlider(data);
    })
  }

  _renderSlider(data) {
    this.render(tmpl, data, $('.km-slider-outer'));
    if (data.data.length > 1) {
      $('#slider').slider({
        loop: true,
        play: true,
        interval: 15 * 1000,
        duration: 1000
      });
    }
  }
}