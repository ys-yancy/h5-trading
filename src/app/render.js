"use strict";
var _ = require('../lib/underscore');

function render(tmpl, data, el, compiled) {
    var html = doRender(tmpl, data, compiled);
    html = $(html);

    if (el) {
        el.html(html);
        return;
    }

    return html;
}

function renderTo(tmpl, data, el, compiled) {
    var html = doRender(tmpl, data, compiled);
    html = $(html);

    $(el).append(html);

    return html;
}

function doRender(tmpl, data, compiled) {
    var tplFn;
    if (typeof tmpl === 'function') {
        tplFn = tmpl;
    } else {
        tplFn = _.template(tmpl);
    }

    var html = tplFn({
        data: data
    });

    return html;
}

module.exports = {
    render: render,
    renderTo: renderTo
};