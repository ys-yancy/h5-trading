'use strict';
import Base from '../../../app/base';
import tmpl from './index.ejs';
export default class Nav extends Base {
    constructor(config) {
        super(config);

        this._render();
    }
    
    _render() {
        this.render(tmpl, {}, this.el);
    }
}