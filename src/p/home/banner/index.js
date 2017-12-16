"use strict";
require('./index.css');
import Base from '../../../app/base';
import tmpl from './index.ejs';
import '../../../common/slider';

export default class HomeBanner extends Base {
	constructor(config) {
		super(config);
		this.render(tmpl, {}, $('.km-slider-outer'));
		$('#slider').slider({
            loop: true,
            play: true,
            interval: 15 * 1000,
            duration: 1000
        });
	}
}