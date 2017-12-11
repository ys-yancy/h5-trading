'use strict';

require('./index.css');
var PageBase = require('../../../app/base');
var tmpl = require('./index.ejs');
var Config = require('../../../app/config');
require('../../../common/slider/index');

export default class Banner extends PageBase {
  constructor(config) {
    super(config);

    this._getData();
  }

  _getData() {
    
    var self = this
    self.ajax({
      url: '/v1/user/profile/invite_ads/?access_token=' + Cookie.get('token') + "&wl=" + Cookie.get('wl')
    }).then((data) => {

      console.log(data)
      if(data.data == ''){

        self.ajax({
          url: '/v1/config/banner'
        }).then((data) => {
          self.render(tmpl, data, $('.km-slider-outer'));

          if (data.data.length > 1) {
            $('#slider').slider({
              loop: true,
              play: true,
              interval: 15 * 1000,
              duration: 1000
            });
          }
        })

      }else{

        var path = getAndroidAvatarUrl() + data.data.substr(8);
        console.log(path);
        var data = {};
        data.data = [path];
        console.log(data);
        self.render(tmpl, data, $('.km-slider-outer'));

        if (data.data.length > 1) {
          $('#slider').slider({
            loop: true,
            play: true,
            interval: 15 * 1000,
            duration: 1000
          });
        }
      }
    }).fail(function(data){

      self.ajax({
        url: '/v1/config/banner'
      }).then((data) => {
        self.render(tmpl, data, $('.km-slider-outer'));

        if (data.data.length > 1) {
          $('#slider').slider({
            loop: true,
            play: true,
            interval: 15 * 1000,
            duration: 1000
          });
        }
      })

    })


    
  }
}