'use strict';

function addInit() {
	_bind();
	getAmount();
}

function _bind() {
	var doc = $(document);
	$('.J_Submit').on('click', $.proxy(_submit, this));

	$('.J_Infor').on('blur', function(e) {
		var curEl = $(e.target);
		var _fn = curEl.attr('data-fn');
		var msg = _validate(curEl, _fn);
		
		if(!msg) {
			curEl.parent().addClass('error');
		}
	});

	doc.on('tap', '.J_CancelDialog', $.proxy(function(e) {
		var dislogEl = $('.J_Dialog');
		dislogEl.hide();
	}, this));
}

/**
 * 绑卡
 */

function _submit(e) {
	e.preventDefault(); 
	e.stopPropagation();
	var curEl = $(e.target);

	var params = getParams();
	if (!params) {
		return
	}

	curEl.prop('disabled', 'disabled');

	$.ajax({
		url: getApiServerUrlPrefix() + '/v1/user/pay/deposit_easypayment_express/?',
		type: 'POST',
		data: params
	}).then(function(data) {
		curEl.prop('disabled', false);
		if (data.status == 200) {
			data = data.data;
			var url = data.req_url + '?' + data.str_req;

			postURL(url);

		} else {
			showMessage(data.message);
		}
	}, function() {
		curEl.prop('disabled', false);
	})
}


function getDolRate() {
	return $.ajax({
		url: getApiServerUrlPrefix() + '/v1/deposit_withdraw_usdcny_rate',
		data: {
			wl: getWXWL()
		}
	}).then(function(data) {
		return data.data.deposit;
	})
}

function getAmount() {
	var urlParams = getQueryParams(window.location.search);

	var amount = urlParams.amount || 0;
	var amountEl = $('.J_Amount', $('.J_BindContent'));
	var amountDescEl = $('.J_AmountDesc', $('.J_BindContent'));
	amountEl.val(amount);
	// getDolRate().then(function(rate) {
	// 	var amounted = parseFloat(amount) * parseFloat(rate);
	// 	amounted = amounted.toFixed(2);

	// 	var amountDesc = amounted + '  元';
	// 	amountDescEl.val(amountDesc)
	// });

	return amount;
}

function getParams() {
	var cardNoEl = $('.J_CardNo', $('.J_BindContent'));
	var userNameEl = $('.J_UserName', $('.J_BindContent'));
	var phoneEl = $('.J_Phone', $('.J_BindContent'));
	var amountEl = $('.J_Amount', $('.J_BindContent'));

	var isSuccess = cardNoEl.parent().hasClass('error') ||
					userNameEl.parent().hasClass('error') ||
					phoneEl.parent().hasClass('error') || 
					!cardNoEl.val() ||
					!userNameEl.val() ||
					!phoneEl.val();

	if (isSuccess) {
		return false
	}

	var params = {
		access_token: getAccessToken(),
		card_type: 'debit_card',
		card_no: cardNoEl.val(),
		card_user_name: userNameEl.val(),
		card_phone_no: phoneEl.val(),
		amount: amountEl.val()
	}

	return params;

}

function showMessage(msg) {
	var dialogEl = $('.J_Dialog');
	var contentEl = $('.content', dialogEl);
	contentEl.text(msg);
	dialogEl.show();
}

function getAccessToken() {
	var access_token = getCookie('token');
	return access_token;
}

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1);
    if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
  }

}

function getQueryParams(qs) {
  qs = qs.split('+').join(' ');
  var params = {},
    tokens,
    re = /[?&]?([^=]+)=([^&]*)/g;
  while (tokens = re.exec(qs)) {
    params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
  }
  return params;
}

 function postURL(url) {
    var form = document.createElement("FORM");
    form.method = "POST";
    form.style.display = "none";
    document.body.appendChild(form);
    form.action = url.replace(/\?(.*)/, function(_, urlArgs) {
      urlArgs.replace(/\+/g, " ").replace(/([^&=]+)=([^&=]*)/g, function(input, key, value) {
        input = document.createElement("INPUT");
        input.type = "hidden";
        input.name = decodeURIComponent(key);
        input.value = decodeURIComponent(value);
        form.appendChild(input);
      });
      return "";
    });
    form.submit();
}

function _validate(curEl, type) {
    var val = curEl.val(),
       	val = val && val.trim();


    if (!val) {
        showError(curEl, '不能为空');
        return;
    }


    if (type === 'cardId') {
        if (!IdCardValidate(val)) {
          showError(curEl, '错误的身份证号码');
          return;
        }
    }

      /**
       * 1|允许出金条件修改为：卡号位数等于16位、18位、19位允许出金。
       * 2、卡号位数为15位、16位时，卡号前四位是6225、4514、4392、4367、5187、5236、5218、5194、5123、3568则判断为信用卡，
       * 输入框下方文案提示“十分抱歉！暂时不支持出金到信用卡”。
       */

    if (type === 'bankId') {
        if (!/^\d{19}$/.test(val) && !/^\d{18}$/.test(val)) {
          	var msg = '错误的卡号';

          /*
          if ((/^\d{16}$/.test(val) || /^\d{15}$/.test(val)) && /^(6225)|(4514)|(4392)|(4367)|(5187)|(5236)|(5218)|(5194)|(5123)|(3568)/.test(val)) {
            msg = '十分抱歉！暂时不支持出金到信用卡'
          } else 
          */
	        if (/^\d{16}$/.test(val) || /^\d{15}$/.test(val) ) {
	            hideError(curEl);
	            return true;
	        }

	        showError(curEl, msg);
	        return;
        }
    }

    if (type && type.match(/\/.*\//)) {
        type = type.slice(1, type.length - 1);
        var reg = new RegExp(type);
        if (!reg.test(val)) {
          showError(curEl, curEl.attr('data-message') + '错误')
          return;
        }
    }

    hideError(curEl);
    return true;
}

function showError(wrapperEl, message) {
	wrapperEl = wrapperEl.parent();
	var errorEl = $('.err', wrapperEl);
	wrapperEl.addClass('error').removeClass('success');
	if (errorEl.length > 0) {
	  var msgEl = $('p', wrapperEl).text(message);
	  return;
	}
	var html = [
	  '<div class="err">',
	  '   <p>' + message + '</p>',
	  '</div>'
	].join('')
	wrapperEl.append(html);
}

function hideError(wrapperEl) {
  	wrapperEl = wrapperEl.parent();
  	wrapperEl.removeClass('error').addClass('success');
}

function showBindContent() {
	//先清空状态
	clearTimeout(countController);
	var hasBankContentEl = $('#J_GoContent');
	var getCodeEl = $('.J_GetGoCode', hasBankContentEl);
	getCodeEl.val('获取验证码').removeClass('repeat').prop('disabled', false);
	
	$('#J_Content').hide();
	$('#J_GoContent').hide();
	$('.J_BindContent').show();
}



var Wi = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2, 1]; // 加权因子
var ValideCode = [1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2]; // 身份证验证位值.10代表X
function IdCardValidate(idCard) {
  idCard = trim(idCard.replace(/ /g, ""));
  if (idCard.length == 15) {
    return isValidityBrithBy15IdCard(idCard);
  } else if (idCard.length == 18) {
    var a_idCard = idCard.split(""); // 得到身份证数组
    if (isValidityBrithBy18IdCard(idCard) && isTrueValidateCodeBy18IdCard(a_idCard)) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
/**
 * 判断身份证号码为18位时最后的验证位是否正确
 * @param a_idCard 身份证号码数组
 * @return
 */
function isTrueValidateCodeBy18IdCard(a_idCard) {
  var sum = 0; // 声明加权求和变量
  if (a_idCard[17].toLowerCase() == 'x') {
    a_idCard[17] = 10; // 将最后位为x的验证码替换为10方便后续操作
  }
  for (var i = 0; i < 17; i++) {
    sum += Wi[i] * a_idCard[i]; // 加权求和
  }
  var valCodePosition = sum % 11; // 得到验证码所位置
  if (a_idCard[17] == ValideCode[valCodePosition]) {
    return true;
  } else {
    return false;
  }
}
/**
 * 通过身份证判断是男是女
 * @param idCard 15/18位身份证号码 
 * @return 'female'-女、'male'-男
 */
function maleOrFemalByIdCard(idCard) {
  idCard = trim(idCard.replace(/ /g, "")); // 对身份证号码做处理。包括字符间有空格。
  if (idCard.length == 15) {
    if (idCard.substring(14, 15) % 2 == 0) {
      return 'female';
    } else {
      return 'male';
    }
  } else if (idCard.length == 18) {
    if (idCard.substring(14, 17) % 2 == 0) {
      return 'female';
    } else {
      return 'male';
    }
  } else {
    return null;
  }
}
/**
 * 验证18位数身份证号码中的生日是否是有效生日
 * @param idCard 18位书身份证字符串
 * @return
 */
function isValidityBrithBy18IdCard(idCard18) {
  var year = idCard18.substring(6, 10);
  var month = idCard18.substring(10, 12);
  var day = idCard18.substring(12, 14);
  var temp_date = new Date(year, parseFloat(month) - 1, parseFloat(day));
  // 这里用getFullYear()获取年份，避免千年虫问题
  if (temp_date.getFullYear() != parseFloat(year) || temp_date.getMonth() != parseFloat(month) - 1 || temp_date.getDate() != parseFloat(day)) {
    return false;
  } else {
    return true;
  }
}
/**
 * 验证15位数身份证号码中的生日是否是有效生日
 * @param idCard15 15位书身份证字符串
 * @return
 */
function isValidityBrithBy15IdCard(idCard15) {
  var year = idCard15.substring(6, 8);
  var month = idCard15.substring(8, 10);
  var day = idCard15.substring(10, 12);
  var temp_date = new Date(year, parseFloat(month) - 1, parseFloat(day));
  // 对于老身份证中的你年龄则不需考虑千年虫问题而使用getYear()方法
  if (temp_date.getYear() != parseFloat(year) || temp_date.getMonth() != parseFloat(month) - 1 || temp_date.getDate() != parseFloat(day)) {
    return false;
  } else {
    return true;
  }
}

function getApiServerUrlPrefix() {
	var dev = 'http://45.121.52.91:8100';
	// var dev = 'http://api.if138.com'
	var prod = getProduClothedUrl();
	if (window.location.origin == 'file://')
	    return dev;
	if (window.location.hostname == 'waibao.invhero.com')
	    return dev;
	if (window.location.hostname == '210.72.229.191')
	    return dev;
	if (window.location.hostname == 'localhost')
	    return dev;
	if (window.location.hostname == '127.0.0.1')
	    return dev;
	    
	return prod;
}

//去掉字符串头尾空格
function trim(str) {
  return str.trim();
}

addInit();