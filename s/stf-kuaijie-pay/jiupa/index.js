'use strict';
var contractId;
var selfBankList = [];
var countController;

var bindObj = null,
	payObj = null;

function addInit() {
	_bind();
	getSelfBankList();
	getAmount();
}

function _bind() {
	var doc = $(document);

	$('.J_BankItem').on('click' , $.proxy(showBindCard, this));
	$('.J_GetCode').on('click', $.proxy(_getCode, this));
	$('.J_SubmitBind').on('click', $.proxy(_submitBind, this));
	$('.J_GetGoCode').on('click', $.proxy(_getGoCode, this));
	$('.J_SubmitGoPay').on('click', $.proxy(_submitGoPay, this))

	$('.J_Infor').on('blur', function(e) {
		var curEl = $(e.target);
		var _fn = curEl.attr('data-fn');
		var msg = _validate(curEl, _fn);
		
		if(!msg) {
			curEl.parent().addClass('error');
		}
	});

	doc.on('change', '.J_Bankcode', $.proxy(function(e){
		var curEl = $(e.target), phone;
		var curOptionEl = $('option:checked', curEl);
		var _fn = curOptionEl.attr('data-fn');

		// 选择新卡
		if (_fn && _fn == 'new-bank') {
			showBindContent();
			return;
		}

		contractId = curEl.val();
		phone = curOptionEl.attr('data-phone');
		updatePayContent(phone);
	}, this));

	doc.on('tap', '.J_CancelDialog', $.proxy(function(e) {
		var dislogEl = $('.J_Dialog');
		dislogEl.hide();
	}, this));

}

function showBindCard(e) {
	var curEl = $(e.target),
		desc = '储蓄卡';
	var bankName = curEl.text();
	var bankAbbr = curEl.attr('data-bankAbbr');

	if (curEl.parents('.J_CreditList').length > 0) {
		desc = '信用卡';
	}

	var contentEl = $('#J_Content');
	var contentBindEl = $('.J_BindContent');
	var bankNameEl = $('#J_BankName', contentBindEl);
	contentEl.hide();
	bankNameEl.val(desc + ' / ' + bankName).attr('data-bankAbbr', bankAbbr);
	showBindContent();
}

/**
 * 获取绑定验证码
 */

function _getCode(e) {
	e.preventDefault(); 
	e.stopPropagation();
	var curEl = $(e.target);
	var params = getBindCardParams();

	_validateMsg(curEl);
	if (!params) {
		return;
	}

	if ( curEl.hasClass('repeat') ) {
		_rePeatCode(curEl);
		return
	}

	curEl.prop('disabled', 'disabled');

	$.ajax({
		url: getApiServerUrlPrefix() + '/v1/user/pay/depost_jiupa_express/bind_card/?',
		type: 'POST',
		data: params
	}).then(function(data) {
		if ( data.status != 200 ) {
			curEl.prop('disabled', false);
			showMessage(data.message);
			return;
		}
		data = data.data;
		bindObj = data;
		setTimeout(function() {
			curEl.val(60);
			countDwon(curEl)
		}, 500);
		
	}, function() {
		curEl.prop('disabled', false);
	})
	
}

/**
 * 获取下单验证码
 */

function _getGoCode(e) {
	e.preventDefault(); 
	e.stopPropagation();
	var curEl = $(e.target);
	var params = getGoPayParams();
	_validateMsg(curEl);
	if (!params) {
		return;
	}

	if ( curEl.hasClass('repeat') ) {
		_rePeatCode(curEl);
		return;
	}

	curEl.prop('disabled', 'disabled');

	$.ajax({
		url: getApiServerUrlPrefix() + '/v1/user/pay/depost_jiupa_express/pay_init/?',
		type: 'POST',
		data: params
	}).then(function(data) {
		if ( data.status != 200 ) {
			curEl.prop('disabled', false);
			showMessage(data.message);
			return;
		}
		data = data.data;
		payObj = data;
		setTimeout(function() {
			curEl.val(60);
			countDwon(curEl)
		}, 500);
		
	}, function() {
		curEl.prop('disabled', false);
	})
}

function _rePeatCode(curEl) {
	var params = {
		access_token: getAccessToken(),
		contractId: contractId
	}

	$.ajax({
		url: getApiServerUrlPrefix() + '/v1/user/pay/depost_jiupa_express/pay_sms/?',
		type: 'POST',
		data: params
	}).then(function(data) {
		if (data.status == 200) {
			setTimeout(function() {
				curEl.val(60);
				countDwon(curEl)
			}, 500);
		}
	})
}

/**
 * 绑卡
 */

function _submitBind(e) {
	e.preventDefault(); 
	e.stopPropagation();
	var curEl = $(e.target);
	if (!bindObj || !curEl.parents('form').find('.J_Vcode').val()) {
		return;
	}

	var params = {
		access_token: getAccessToken(),
		contractId: bindObj.contractId,
		checkCode: $('.J_Vcode', $('.J_BindContent')).val()
	}

	curEl.prop('disabled', 'disabled');

	$.ajax({
		url: getApiServerUrlPrefix() + '/v1/user/pay/depost_jiupa_express/bind_card_commit/?',
		type: 'POST',
		data: params
	}).then(function(data) {
		curEl.prop('disabled', false);
		if ( data.status != 200 ) {
			showMessage(data.message);
			return;
		}
		data = data;
		var bankObj = getBindCardParams();
		bankObj.contractId = bindObj.contractId;
		var curBankList= [bankObj];
		renderSelfList(curBankList);
	}, function() {
		curEl.prop('disabled', false);
	})
}

/**
 *  支付
 */
function _submitGoPay(e) {
	e.preventDefault(); 
	e.stopPropagation();
	var curEl = $(e.target);
	if (!payObj || !curEl.parents('form').find('.J_Vcode').val()) {
		return;
	}

	var params = {
		access_token: getAccessToken(),
		orderId: payObj.orderId,
		checkCode: $('.J_Vcode', $('#J_GoContent')).val()
	}

	curEl.prop('disabled', 'disabled');

	$.ajax({
		url: getApiServerUrlPrefix() + '/v1/user/pay/depost_jiupa_express/pay_commit/?',
		type: 'POST',
		data: params
	}).then(function(data) {
		curEl.prop('disabled', false);
		if ( data.status == 200 ) {
			data = data.data;
			if(data.orderSts) {
				showMessage(orderSts[data.orderSts]);
				setTimeout(function(){
					window.location.href = '../recharge.html';
				}, 5000);
				return
			} else {
				ajaxPayReslut();
			}
		} else {
			showMessage(data.message);
			setTimeout(function(){
				window.location.href = window.location.href;
			}, 5000);
		}
	}, function() {
		curEl.prop('disabled', false);
	})
}

// 获取支持的银行卡
function getAddList() {
	$.ajax({
		url: getApiServerUrlPrefix() + '/v1/user/pay/depost_jiupa_express/bank_list/?',
		type: 'GET'
	}).then(function(data) {
		var list = data.data;
		var bankList = list.bank_list; //储蓄
		var creditList = list.credit_bank_ist; //信用
		if(!bankList && bankList.length === 0 && creditList.length === 0) {
			console.log('暂不支持')
			return;
		}

		render(bankList, false);
		render(creditList, true);

		showContent();
	})
}

// 获取已经有的
function getSelfBankList() {
	$.ajax({
		url: getApiServerUrlPrefix() + '/v1/user/pay/depost_jiupa_express/user_bind_cardList/?access_token=' + getAccessToken(),
		type: 'GET'
	}).then(function(data) {
		data = data.data;
		var list = data.card_list;
		selfBankList = list;
		if (!list || list.length === 0) { //没有记录
			// getAddList();  // 选卡一步
			showBindContent(); // 直接输入卡号
			return;
		}

		// 有记录
		renderSelfList(list);
	})
}

function ajaxPayReslut() {
	$.ajax({
		url: getApiServerUrlPrefix() + '/v1/user/pay/depost_jiupa_express/query_order/?',
		data: {
			access_token: getAccessToken(),
			order_id: payObj.orderId
		}
	}).then(function(data) {
		if( data.status == 200 ) {
			data = data.data;
			if (data && data.payResult && orderSts[data.payResult]) {
				showMessage(dorderSts[data.payResult]);
			} else {
				showMessage('支付结果未知， 请联系客服！');
			}

			setTimeout(function(){
				window.location.href = '../recharge.html';
			}, 5000);
		}
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
	var amountEl = $('.J_Amount', $('#J_GoContent'));
	var amountDescEl = $('.J_AmountDesc', $('#J_GoContent'));
	amountEl.val(amount);
	getDolRate().then(function(rate) {
		var amounted = parseFloat(amount) * parseFloat(rate);
		amounted = amounted.toFixed(2);

		var amountDesc = amounted + '  元';
		amountDescEl.val(amountDesc)
	});

	return amount;
}

/**
 * list 银行卡列表
 * isCredit 是否为信用卡
 */

function render(list, isCredit) {
	var contentEl = $('#J_Content');
	var listWrapperEl = $('<ul class="list-wrapper J_List">'),
		hdEl = $('<li class="hd">');

	hdEl.text('储蓄卡');

	if (isCredit) {
		hdEl.text('信用卡');
		listWrapperEl = $('<ul class="list-wrapper J_CreditList">')
	}

	listWrapperEl.append(hdEl);
	_render(listWrapperEl, contentEl, list);
}

function _render(childEl, parentEl, list) {
	var liEl = $('<li class="item-wrapper">');
	for (var i = 0, len = list.length; i < len; i++) {
		var item = list[i];
		liEl.append(
			$('<span class="item J_BankItem">').text(item.bankName).attr('data-bankAbbr', item.bankAbbr)
		)
		if (i !== 0 && (i + 1) % 3 === 0) {
			childEl.append(liEl);
			liEl = $('<li class="item-wrapper">');
		}
	}
	parentEl.append(childEl);
}

// 渲染已有的银行卡
function renderSelfList(list) {
	var isOne = true;
	var hasBankContentEl = $('#J_GoContent');
	var selectEl = $('.J_Bankcode', hasBankContentEl);
	var phoneEl = $('.J_Phone', hasBankContentEl);

	// 渲染之前填充一下
	selectEl.empty();

	for (var i = 0, len = list.length; i < len; i++) {
		var item = list[i];

		var optionEl = $('<option/>')
			.text(item.cardNo)
			.prop('value', item.contractId)
			.attr('data-phone', item.phone || item.bankMobileNo);
		selectEl.append(optionEl);

		if (isOne) {
			contractId = item.contractId;
			phoneEl.val(item.phone || item.bankMobileNo);
			isOne = false;
		}
	}

	selectEl.append(
		$('<option/>').text('选择新卡').attr('data-fn', "new-bank")
	)

	showGoContent();
}

function updatePayContent(ph) {
	var hasBankContentEl = $('#J_GoContent');
	var phoneEl = $('.J_Phone', hasBankContentEl);
	var getCodeEl = $('.J_GetGoCode', hasBankContentEl);
	
	clearTimeout(countController);

	phoneEl.val(ph);
	getCodeEl.val('获取验证码').removeClass('repeat').prop('disabled', false);

}

function _validateMsg(curEl) {
	var validateEls = curEl.parents('form').find('.J_Infor');
	for (var i = 0, len = validateEls.length; i < len; i++) {
		var validateEl = $(validateEls[i]);
		var _fn = validateEl.attr('data-fn');
		var msg = _validate(validateEl, _fn);
		
		if(!msg) {
			validateEl.parent().addClass('error');
		}
	}
}

function countDwon(curEl) {
	curEl.prop('disabled', true);
	var time = parseFloat(curEl.val());
	curEl.val(--time);
	if (time <= 0) {
		clearTimeout(countController);
		curEl.val('重新获取').prop('disabled', false)
		.addClass('repeat');
		return;
	}

	countController = setTimeout(function() {
		countDwon(curEl);
	}, 1000)
}


function getBindCardParams() {
	var cardNoEl = $('.J_CardNo', $('.J_BindContent'));
	var idNoEl = $('.J_IdCard', $('.J_BindContent'));
	var userNameEl = $('.J_UserName', $('.J_BindContent'));
	var phoneEl = $('.J_Phone', $('.J_BindContent'));

	var isSuccess = cardNoEl.parent().hasClass('error') ||
					idNoEl.parent().hasClass('error') ||
					userNameEl.parent().hasClass('error') ||
					phoneEl.parent().hasClass('error') || 
					!cardNoEl.val() ||
					!idNoEl.val() ||
					!userNameEl.val() ||
					!phoneEl.val();

	if (isSuccess) {
		return false
	}

	var params = {
		access_token: getAccessToken(),
		bind_type: 'sms',
		cardNo: cardNoEl.val(),
		userName: userNameEl.val(),
		phone: phoneEl.val(),
		idType: '00',
		idNo: idNoEl.val(),
		card_type: 0
	}

	return params;

}

function getGoPayParams() {
	var wrapEl = $('#J_GoContent');
	var amountEl = $('.J_Amount', wrapEl);
	var bankcodeEl = $('.J_Bankcode', wrapEl);
	var phoneEl = $('.J_Phone', wrapEl);
	var codeEl = $('.J_Vcode', wrapEl);

	return {
		access_token: getAccessToken(),
		contractId: contractId,
		payType: 'DQP',
		amount: amountEl.val(),
	}
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

function showMessage(msg) {
	var dialogEl = $('.J_Dialog');
	var contentEl = $('.content', dialogEl);
	contentEl.text(msg);
	dialogEl.show();
}

function showContent() {
	$('#J_Content').show();
	$('#J_GoContent').hide();
	$('.J_BindContent').hide();
}

function showGoContent() {
	$('#J_GoContent').show();
	$('#J_Content').hide();
	$('.J_BindContent').hide();
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

var orderSts = {
	'WP': '等待付款',
	'PP': '支付中',
	'PD': "支付成功",
	'CZ': "订单关闭",
	'EX': '订单过期',
	'CA': '交易取消',
	'RE': '订单退款',
	'RF': '全额退款成功',
	'RP': '部分退款成功',
	'RQ': '退款已受理',
	"NE": '订单不存在',
	"RK": '风控拒绝',
	'B2': '支付处理中',
	'R1': '退款处理中'
}

addInit()