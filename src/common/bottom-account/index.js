'use strict';
import './index.css';
import PageBase from '../../app/page-base';
import Config from '../../app/config';
import Util from '../../app/util';
import Hammer from '../../lib/hammer';
import Dialog from '../dialog';
import tmpl from './index.ejs';
import tmpl2 from './message.ejs';
import tmpl3 from './message2.ejs';
import dialogTmpl from './dialod.ejs';

export default class BottomAccount extends PageBase {
	constructor(config) {
		super(config);
		this.init();
	}

	init() {
		this._initAttrs();
		this._bind();
		// _getAccount() 和 getAccountData({ interval: true }) 调用后面的即可, 如果有问题都调用
	    // this._getAccount(); 
		this.getAccountData({ interval: true });
	  
	    this.checkOne = false;
	    this.checkTwo = false;
	}

	_bind() {
		this.subscribe('update:account', this.getAccountData, this);
		this.subscribe('get:accountData', this._getAccountData, this);
	    this.subscribe('get:orderHistoryDetail', this._getOrderHistoryDetail, this);
	    //this.subscribe('reject:realToken', this._reject, this);

	    this.on('get:done', () => {
		    setTimeout(() => {
		        this.getAccountData({ fresh: true, interval: true });
		    }, 30 * 1000);
	    });

	    this.el.on('click', (e) => {
	      	if (self.isTwincle) {
	        	this.dialog();
	      	}
	    })
	}

	getAccountData(e) {
		this._getAccount(e);
	}

	_getAccountData(data) {
		data.init = true;
	    let detail = this._getDetail();

	    data = $.merge(data, detail);
	    data.page = this.page;
	    data.balance = this._getBalance();
	    this.update(data);
	}

	_reject() {
		this.fire('toggle:account:error');
	}

	interval() {
		this.inerval = setTimeout(() => {
		    try {
		        this.autoFresh = true;
		        this._getAccount().then(() => {
		          	this.interval();
		        });
		    } catch (e) {
		        this.interval();
		    }
	    }, Config.getInterval());
	}

	_getAccount(e) {
		let type = this.isDemo() ? 'demo' : 'real',
      		typeTag = 'init-' + type;

      	if (e && e.fresh) {
      		this.autoFresh = true;
      	}

      	if (this[typeTag] && !this.autoFresh) {
      		this._toggleAccount();
      		return;
      	}
      
      	return this._getAccountFromCache(e && e.fresh).then((data) => {
	  	  	this.orderList = data;
	      	this[type + 'OrderList'] = data;
	      	this.broadcast('get:orderList', data);

	      	this.getFloatingProfit(this.account, data.list, data.symbols).then((profit, floatOption) => {

		      	let margin = parseFloat(this.account[type].margin);
		      	let netDeposit = parseFloat(this.account[type].balance) + parseFloat(profit);
		        let freeMargin = netDeposit - parseFloat(data.margin);

		        let bait = parseFloat(this.account[type].bait ? this.account[type].bait : 0);
		        let bonus = parseFloat(this.account[type].bonus ? this.account[type].bonus : 0);
		        let untriggeredBonus = parseFloat(this.account[type].untriggered_bonus ? this.account[type].untriggered_bonus : 0);

		        let rate;
		        if (data.margin == 0) {
		        	rate = '--';
		        } else {
		        	rate = (( freeMargin + margin - Math.max(margin, untriggeredBonus) + margin ) / margin * 100).toFixed(2);
		        }

		        let detail = this._getDetail();

		        this._setBalance(this.account);
		        // 改变账户条颜色
		        // this._checkBAStatus(data, rate, type);

		        let tmplData = {
			        netDeposit: netDeposit,
			        freeMargin: freeMargin,
			        profit: profit,
			        rate: rate,
			        type: type,
			        bonus: bonus,
			        init: this.hasInit,
			        balance: this._getBalance(),
			        page: this.page
			    };

			    tmplData = $.merge(tmplData, detail);
			    
			    this.update(tmplData);
			    this[typeTag] = true;

		        this._toggleAccount();
		        this.fire('get:realFloatMargin', floatOption);
		        e && e.interval && this.fire('get:done');
	      	});
      	}, () => {
      		if (location.href.indexOf('/option.html') !== -1) {
		        return;
		    }
		    if (!this.isDemo()) {
		        this.cookie.set('type', getSimulatePlate() ? 'demo' : 'real');
		        this._getAccount();
		    }
      	})

	}

	_getAccountFromCache(fresh) {
		let d = new $.Deferred(),
      		type = this.isDemo() ? 'demo' : 'real';

	    if (!fresh && this.cacheOrderList[type]) {
	      	d.resolve(this.cacheOrderList[type]);
	    } else {
		    this.getAccount().then((data) => {
		        this.account = data.account;
		        return this.getCurrentOrderList();
		   	}).then((data) => {
		        let type = this.isDemo() ? 'demo' : 'real';
		        this.cacheOrderList[type] = data;
		        d.resolve(data);
		    });
    	}

    	return new d.promise();
	}

	_toggleAccount() {
		let isDemo = this.isDemo();
	    isDemo ? this.el.removeClass('real') : this.el.addClass('real');

	    this.orderList = isDemo ? this.demoOrderList : this.realOrderList;
	    this.fire('toggle:account', {
	      	demo: isDemo
	    });
	}

	_checkBAStatus(data, rate, type) {
		let margin = data.margin,
			isReal = type === 'real';

		if (margin && isReal) {
			let originRate = parseFloat(rate) / 100;
			if (originRate < 1) {
				this.broadcast('check:closed');
	            this.isTwincle = false;
	            this.hideTwincle();
			} else if (originRate < 1.1 && this.checkOut) {
				this._changeBAStatusTwo();
			} else if (originRate < 1.3 && this.checkOut) {
				this._changeBAStatusOne();
			} else {
				this.hideTwincle();
            	this.isTwincle = false;
			}
		} else if (!margin && isReal) {
			this.hideTwincle();
          	this.isTwincle = false;
		}
	}

	_changeBAStatusOne() {
		this.showTwincle();
    	this.isTwincle = true;
    	let hasOriginRateOne = this.cookie.get('originRateOne');
    	if(hasOriginRateOne) {} else {
    		$('.removeLogout').remove();
            new Dialog({
                isShow: true,
                tmpl: this.render(tmpl2),
                confirmCallback: isMessageOne,
                cancleCallback: isMessageOne
            });

            if(this.checkOne){
                $('#isShowMessage')[0].checked=true;
                $('#oneDay').css("color","rgb(158, 102, 102)");
            }

          	$('#charge').attr('href', './recharge.html?src=' + encodeURIComponent(location.href));

          	function isMessageOne() {
                Cookie.set('originRateOne', true, {
                  	expires: Config.getOriginRateOneExpireTime()
                });

                $('.removeLogout').remove();

                if(self.checkOne){
                  	Cookie.set('originRateOne', true, {
                      	expires: Config.getOriginRateTwoExpireTime()
                  	});
                }
            }
    	}
	}

	_changeBAStatusTwo() {
		this.showWarn();
    	this.isTwincle = true;
    	let hasOriginRateTwo = this.cookie.get('originRateTwo');
    	if (hasOriginRateTwo) {} else {
    		$('.removeLogout').remove();
    		new Dialog({
                isShow: true,
                tmpl: this.render(tmpl3),
                confirmCallback: isMessageTwo,
                cancleCallback: isMessageTwo
            });

            if (this.checkTwo) {
            	$('#isShowMessageTwo')[0].checked = true;
        		$('#oneDay').css("color","rgb(158, 102, 102)");
            }

            $('#charge').attr('href', './recharge.html?src=' + encodeURIComponent(location.href));

            function isMessageTwo() {
            	Cookie.set('originRateTwo', true, {
	                expires: Config.getOriginRateOneExpireTime()
	            });

	            $('.removeLogout').remove();
	            if(this.checkTwo){
	                Cookie.set('originRateTwo', true, {
	                    expires: Config.getOriginRateTwoExpireTime()
	                });
	            }
            }
    	}
	}
	
	_getOrderHistoryDetail(data) {
		let type = this.isDemo() ? 'demo' : 'real';

		$('.J_TotalTrade').text(data.totalTrade);
	    this[type + 'totalTrade'] = data.totalTrade;
	    this[type + 'total'] = data.total
	}

	_getDetail() {
		let type = this.isDemo() ? 'demo' : 'real';

	    return {
	      	totalTrade: this[type + 'totalTrade'],
	      	total: this[type + 'total']
	    }
	}

	_getBalance() {
		let type = this.isDemo() ? 'demo' : 'real';

    	return this[type + 'Balance'];
	}

	_setBalance(account) {
	 	this.realBalance = parseFloat(account.real.balance);
	 	if (getSimulatePlate()) {
	      	this.demoBalance = parseFloat(account.demo.balance);
	    } 
	}

	update(data) {
		if (!this.hasInit) {
	    	this._render(data);
	    	return;
	    }
	    
		this.renderX(this.floatProfitEl, data.profit);
	    this.renderX(this.freeMarginEl, data.freeMargin);
	    this.renderX(this.rateEl, data.rate);
	    this.renderX(this.netDepositEl, data.netDeposit);
	    this.renderX(this.balanceEl, data.balance);
	    this.renderX(this.totalProfitsEl, data.total);
	}

	renderX(el, val) {
		let intEl = $('.int', el);
	    let floatEl = $('.small', el);
	    let minus = false;

	    if (val === '--' || val === undefined) {
		    intEl.text('--');
		    floatEl.text('');
		    return;
	    }

	    if (val < 0 && parseInt(val) == 0) {
	     	 minus = true;
	    }

	    // 尝试解决 1.99999 和 -1.99999 的问题
	    var num;
	    if (val.toString().indexOf('.999') != -1) {
		    if (val > 0) {
		        num = parseInt(val + 1) + '.';
		    } else {
		        num = parseInt(val - 1) + '.';
		    }
	    } else {
	      	num = parseInt(val) + '.';
	    }

	    num = minus ? '-' + num : num;

	    intEl.text(num);

	    floatEl.text(Math.abs(parseFloat(val) - parseInt(val)).toFixed(2).slice(2));
	}

	_check() {
		this.checkOne = $('#isShowMessage')[0].checked;
    	this.checkOne ? $('#oneDay').css("color","rgb(158, 102, 102)") : $('#oneDay').css("color","#666");
	}

	_checkTwo() {
		this.checkTwo = $('#isShowMessageTwo')[0].checked;  
    	this.checktwo ? $('#oneDay').css("color","rgb(158, 102, 102)") : $('#oneDay').css("color","#666");
	}

	showTwincle() {
		this.el.addClass('twinkle').removeClass('twinkle-warn');
	}

	showWarn() {
		this.el.addClass('twinkle-warn').removeClass('twinkle');
	}

	hideTwincle() {
		this.el.removeClass('twinkle-warn').removeClass('twinkle');
	}

	dialog() {
	    this.warnDialog = new Dialog({
		    isShow: true,
		    confirmAndClose: true,
		    tmpl: this.render(dialogTmpl, {})
	    });
	}

	show() {
    	this.el.show();
  	}

	destroy() {
		clearTimeout(this.interval);
		this.cookie.expire('goType');
	    this.unsubscribe('get:accountData', this._getAccountData, this);
	    this.unsubscribe('get:orderHistoryDetail', this._getOrderHistoryDetail, this);
	    this.cookie.set('type', getSimulatePlate() ? 'demo' : 'real', {
	      	expires: Infinity
	    });
	}

	_render(tmplData) {
		this.render(tmpl, tmplData, this.el);

        this.hasInit = true;

        this.floatProfitEl = $('.J_FloatProfit', this.el);
        this.freeMarginEl = $('.J_FreeMargin', this.el);
        this.rateEl = $('.J_Rate', this.el);
        this.netDepositEl = $('.J_NetDeposit', this.el);
        this.balanceEl = $('.J_Balance', this.el);
        this.totalProfitsEl = $('.J_Profits', this.el);

        let panEl = $('ul', this.el);
        let scrollEl = $('.item-wrapper', this.el);
        let arrowEl = $('.arrow', this.el);

        scrollEl.on('scroll', (e) => {
        	let width = scrollEl.width();
            let scrollLeft = scrollEl.scrollLeft();
            if (scrollLeft + width === panEl.width()) {
              arrowEl.addClass('end');
            } else {
              arrowEl.removeClass('end');
            }

        });
	}

	_initAttrs() {
	    this.prices = {};
	    this.cacheOrderList = {};
	}
}