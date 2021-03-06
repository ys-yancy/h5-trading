require('./index.css');

var PageBase = require('../../../app/page-base');
var tmpl = require('./index.ejs');

export default class Popup extends PageBase {
  constructor(data) {
    super();

    this.el = $(this.render(tmpl, data || {}));
    this.mask = $('#J_PopupMask');

    $(document.body).append(this.el);
    this.mask.show();
    this.el.addClass('show');
    this._bind();
  }

  _bind() {
    var doc = $(document);

    $('.J_ClosePopup').on('click', () => {
      this.close();
    });

    this.mask.on('touchmove', function(e) {
      e.preventDefault();
    });
  }

  close() {
    this.el.removeClass('show');
    this.el.hide();
    this.mask.hide();
    this.broadcast('action:hideLoad');
  }

  show() {
    this.el.show();
    this.mask.show();
  }

  destroy() {
    $('.J_ClosePopup', this.el).off('click');
    this.mask.off('touchmove', function(e) {
      e.preventDefault();
    });
    this.el.remove();
  }
}