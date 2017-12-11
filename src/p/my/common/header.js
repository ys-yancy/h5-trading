var Uri = require('../../../app/uri');

var url = new Uri().getParam('from');

if (url && url !== 'undefined') {
  $('.go-back', 'header').attr('href', url).show();
}