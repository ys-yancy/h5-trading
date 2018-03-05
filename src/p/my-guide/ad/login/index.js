"use strict";
import Base from '../../../../app/base';
import Uri from '../../../../app/uri';
import Util from '../../../../app/util';
import Statistics from '../../../../app/statistics';
import Toast from '../../../../common/toast';
import Validate from '../../../../common/validate';
import Cookie from '../../../../lib/cookie';

class Login extends Base {
	constructor(config) {
		super(config);
		this._init();
	}

	_init() {
		this._bind();
	    this._initValidate();
	    Statistics.configStatistics();
	}

	_bind() {
		$('.J_Validate').on('change blur', $.proxy(this._change, this));
    	$('form').on('submit', $.proxy(this._submit, this));

	    // 添加默认微信分享
	    if (this.isWeixin()) {
	    	// TODO: 在品种手机中 会报错 Cannot find variable Cookie
	    	// 应该是weixin.js中有问题
	      	// this.setupWeiXinShare('default_invite');  
	    }
	}

	_change(e) {
		let curEl = $(e.currentTarget),
			parent = curEl.parent('.wrapper'),
			submitEl = $('.submit');	

		let value = curEl.val();

    	if (curEl.hasClass('tel')) {
    		return this._validateTel(value, parent);
    	} else if (curEl.hasClass('password')) {
    		return this._validatePsd(value, parent)
    	}
	}

	_submit(e) {
		e.preventDefault();
		let submitEl = $('.submit'),
			validateEl = $('.J_Validate'),
			valid = true;

		validateEl.blur();
		validateEl.each((index, item) => {
			if (!this._change({
				currentTarget: $(item)
			})) {
				valid = false;
			}
	    });

	    if (!valid) {
	    	return;
	    }

	    let password = $('.password').val(),
      		phone = $('.tel').val();

	   	submitEl.val('处理中')
	   		.addClass('disable');
	   	this.ajax({
	   		url: '/v1/user/login',
		    type: 'post',
		    data: {
		        phone: phone,
		        password: password,
				cc: 86,
				wl: getWXWL()
		    },
		    noToast: true
	   	}).then((data) => {
	   		data = data.data;
			Cookie.expire('wl');
		    Cookie.set('token', data.token, {
		        expires: Infinity
		    });
		    Cookie.set('phone', data.phone, {
		        expires: Infinity
		    });
		    Cookie.set('uuid', data.uuid, {
		        expires: Infinity
		    });
		    Cookie.set('inviteCode', data.invite_code, {
		        expires: Infinity
			});
			
			Cookie.set('deposits', data.deposits, {
				expires: Infinity
			});


		    if (!Cookie.get('type')) {
		        Cookie.set('type', 'demo', {
		          	expires: Infinity
		        });
		    }

            submitEl.val('登录').removeClass('disable');

			location.href = '../../' + getHomeUrl();
	   	}, () => {
	   		submitEl.val('登录').removeClass('disable');

            new Toast('手机号或密码错误');
	   	})
	}

	_validateTel(value, parent) {
		let validator = this.validator;

		let error = validator.validateField({
	        name: 'tel',
	        display: 'required',
	        rules: 'required|callback_tel_number',
	        value: value
	    });

		if (error) {
	        this.showError(parent, error.message);
	        return false;
	    } else {
	        this.hideError(parent);
	        return true;
	    }
	}

	_validatePsd(value, parent) {
		let validator = this.validator;

		let error = validator.validateField({
	        name: 'password',
	        rules: 'required',
	        value: value
	    });

	    if (error) {
	        this.showError(parent, error.message);
	        return false;
	    } else {
	        this.hideError(parent);
	        return true;
	    }
	}

	_initValidate() {
		let validator = new FormValidator('form', [
			{
				name: 'tel',
			    display: 'required',
			    rules: 'required|callback_tel_number'
			},
			{
				name: 'password',
      			rules: 'required'
			}
		], (errors, e) => {
			if (errors.length > 0) {
				e.preventDefault();
				if ($('.submit').hasClass('disable')) {
					return;
				}

				for (let i = 0, len = errors.length; i < len; i++) {
					let wrapperEl =  $(errors[i].element).parent('.wrapper'),
						message = errors[i].message;
					this.showError(wrapperEl, message);
				}
			}
		});

		validator.registerCallback('tel_number', function(value) {
			if (/^(0|86|17951)?(13[0-9]|15[012356789]|18[0-9]|14[57]|17[0123456789])[0-9]{8}$/.test(value)) {
				return true;
			} else {
				return false;
			}
		})
		.setMessage('tel_number', '请输入正确的手机号码')
		.setMessage('required', '此项为必填项目');

		this.validator = validator;
	}

	showError(wrapperEl, message) {
		let errorEl = $('.err', wrapperEl);

	    wrapperEl.addClass('error');

	    if (errorEl.length > 0) {
	      	errorEl.text(message);
	      	return;
	    }

	    wrapperEl.append('<div class="err">' + message + '</div>');
	}

	hideError(wrapperEl) {
		wrapperEl.removeClass('error');
	}
}

new Login();