module.exports = {
    _showError(curEl, message) {
        var wrapperEl = curEl.parent();
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
        ].join('');

        wrapperEl.append(html);
    },

    _hideError(curEl) {
        var wrapperEl = curEl.parent();
        wrapperEl.removeClass('error').addClass('success');
    }
}