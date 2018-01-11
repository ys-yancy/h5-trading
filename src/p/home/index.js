"use strict";

import Base from '../../app/base';
import BottomNav from '../../common/bottom-nav';
import SildeMenu from '../../common/slide-menu';
import FloatMsg from '../../common/float-msg';
import Banner from './banner';

class Home extends Base {
	constructor(config) {
		super(config);
		new Banner();
		new FloatMsg();
		new BottomNav({
			page: 'home'
		})
		new SildeMenu({
			el: $('#J_SlideMenu'),
			page: 'home'
		})
	}
}

new Home();