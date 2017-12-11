'use strict';

var PageBase = require('../../../app/page-base');
var Uri = require('../../../app/uri');

export default class Guides extends PageBase {
  constructor() {
    super();

    // if (this.cookie.get('token')) {
    //   location.href = './festival-guide.html';
    //   return;
    // }

    var linkEl = $('.J_Show');

    if (this.cookie.get('token')) {
      linkEl.attr('href', '../share.html?from=' + encodeURIComponent(location.href));
    }

    this._bind();

    $('#J_GoRegister').hide();
    $('#J_GoGetPassWord').hide();
  }

  _bind() {
    $('.J_Show').on('click', (e) => {
      this.login().then((data) => {
        location.href = './festival-guide.html?from=' + encodeURIComponent(location.href);
      });
    });
  }

  // this._bind();
  // var params = new Uri().getParams();
  // this.inviteCode = params.inviteCode;
}

new Guides();