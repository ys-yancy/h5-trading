'use strict';

var Base = require('../../app/base');
var tmpl = require('./index.ejs');

function BottomNavComponent() {
    BottomNavComponent.superclass.constructor.apply(this, arguments);
    this.init();
    //getBottomNavPages
}
Base.extend(BottomNavComponent, Base, {
    init() {
        var config = this.defaultConfig;

        if (this.page) {
            config.page = this.page;
        }
        
        try {
            var pages = getBottomNavPages();
            config.pages = pages;
            config.pageCount = pages.length;
        } catch(e) {
            this.render(tmpl, config, $('footer'));
        }

        this.render(tmpl, config, $('footer'));

    },

    attrs: {
        defaultConfig: {
            page: 'option',
            pages: ['home', 'option', 'master', 'actual', 'news'],
            pageCount: 5
        } 
    }
});

module.exports = BottomNavComponent;