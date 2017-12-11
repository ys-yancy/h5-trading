require('./index.css');

var PageBase = require('../../../app/page-base');
var Validate = require('../../../common/validate');
var Uri = require('../../../app/uri');
var Toast = require('../../../common/toast');



export default class Investment extends PageBase {
  constructor() {
    super();

    this.el = $('#J_InvestDialog');
    this.el.show();
    $('#J_PopupMask').show();

    this._initValidate();

    this._bind();
  }

  _bind() {
    var doc = $(document);

    $('.J_Validate').on('change blur', $.proxy(this._change, this));
    $('form').on('submit', $.proxy(this._submit, this));
    doc.on('tap', '.get-code', $.proxy(this._getCode, this));
  }

  _change(e) {
    var curEl = $(e.currentTarget),
      parent = curEl.parent('.wrapper'),
      validator = this.validator;

    this.curEl = curEl;
    var value = curEl.val();
    var error;
    var getCodeEl = $('.get-code');
    var submitEl = $('.submit');

    // this.formEl.submit();
    // return;

    if (curEl.hasClass('tel')) {
      error = validator.validateField({
        name: 'tel',
        display: 'required',
        rules: 'required|callback_tel_number',
        value: value
      });
      if (error) {
        this.showError(parent, error.message);
        getCodeEl.addClass('disable');
      } else {
        this.hideError(parent);
        getCodeEl.removeClass('disable');
      }
    } else if (curEl.hasClass('code')) {
      error = validator.validateField({
        name: 'code',
        rules: 'required',
        value: value
      });

      if (error) {
        this.showError(parent, error.message);
      } else {
        this.hideError(parent);
      }
    }

    var disable = false;

    $('.wrapper', '#J_FormInvest').each(function(index, item) {
      item = $(item);
      if (!item.hasClass('submit-wrapper')) {
        if (!$(item).hasClass('success')) {
          disable = true;
        }
      }

    });

    if (disable) {
      submitEl.addClass('disable');
    } else {
      submitEl.removeClass('disable');
    }
  }

  showError(wrapperEl, message) {
    var errorEl = $('.error', wrapperEl);
    wrapperEl.addClass('error').removeClass('success');
    if (errorEl.length > 0) {
      var msgEl = $('p', wrapperEl).text(message);
      return;
    }
    var html = [
      '<div class="error">',
      '   <span class="icon"></span>',
      '   <p>' + message + '</p>',
      '</div>'
    ].join('');

    wrapperEl.append(html);
  }

  _getCode(e) {
    var telEl = $('.tel').val(),
      curEl = $(e.currentTarget);

    $('.code').removeAttr('disabled');
    if (curEl.hasClass('disable')) {
      return;
    }

    this._countdown(curEl);

    this.ajax({
      url: '/v1/captcha/' + telEl,
      type: 'post',
      data: {
        cc: 86,
        wl: getWXWL(),
        _r: Math.random()
          //phone: telEl
      }
    }).then(function(data) {

    });
  }

  _countdown(el) {
    var count = 60;

    coundown();
    el.val(count);
    el.addClass('disable');

    function coundown() {
      setTimeout(function() {
        var val = el.val();

        if (val == 0) {
          el.val('重新获取');
          el.removeClass('disable');
        } else {
          val -= 1;
          el.val(val);


          coundown();
        }
      }, 1000);
    }
  }

  hideError(wrapperEl) {
    wrapperEl.removeClass('error').addClass('success');
  }

  _submit(e) {
    var self = this,
      submitEl = $('.submit');
    e.preventDefault();

    if (submitEl.hasClass('disable')) {
      return false;
    }

    if (submitEl.hasClass('on-discuss')) {
      return;
    }

    this._showLoad(submitEl);

    var formEl = $('#J_FormInvest');
    var phone = $('.tel', formEl).val();
    var vcode = $('.code', formEl).val();

    // submitEl.addClass('disable');
    // submitEl.text('提交中');

    this.ajax({
      url: '/v1/user/phone2',
      type: 'post',
      data: {
        access_token: this.cookie.get('token'),
        phone: phone,
        vcode: vcode,
        cc: 86,
        wl: getWXWL()
      }
    }).then((data) => {
      this.cookie.set('real_token', data.data.real_token);
      this.cookie.set('phone', phone);


      var refer = new Uri().getParam('refer') || this.cookie.get('referCode');
      if (refer) {
        this.ajax({
          url: '/v1/user/refer/',
          data: {
            access_token: this.cookie.get('token'),
            invite_code: refer
          },
          type: 'post'
        }).then(() => {
          this._getLottery();
        })
      }
    }, (data) => {
      new Toast(data.message);
      this._hideLoad();
    });
  }

  _getLottery() {
    this.ajax({
      url: '/v1/hongbao/use/',
      type: 'post',
      data: {
        access_token: this.cookie.get('token'),
        wl: getWXWL()
      }
    }).then(() => {
      this.broadcast('invest:now');
    });
  }

  _initValidate() {
    var self = this;

    var validator = new FormValidator('form', [{
      name: 'tel',
      display: 'required',
      rules: 'required|callback_tel_number'
    }, {
      name: 'password',
      rules: 'required'
    }, {
      name: 'repassword',
      rules: 'required|matches[password]'
    }, {
      name: 'code',
      rules: 'required'
    }], function(errors, e) {
      if (errors.length > 0) {
        e.preventDefault();
        // console.log(errors);
        if ($('.submit').hasClass('disable')) {
          return;
        }
        for (var i = 0, len = errors.length; i < len; i++) {
          var wrapperEl = $(errors[i].element).parent('.wrapper'),
            message = errors[i].message;

          self.showError(wrapperEl, message);
        }
      }
    });

    validator.registerCallback('tel_number', function(value) {
        if (/((\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$)/.test(value)) {
          return true;
        }
        return false;
      })
      .setMessage('tel_number', '请输入正确的手机号码')
      .setMessage('required', '此项为必填项目')
      .setMessage('matches', '两次输入密码不一致');

    this.validator = validator;
  }

  _showLoad(curEl) {
    this.loadEl = curEl;

    curEl.val('提交中...').addClass('on-discuss');
  }

  _hideLoad() {
    //var name = this.loadEl.attr('data-name');
    this.loadEl.val('确认').removeClass('on-discuss');
  }
}