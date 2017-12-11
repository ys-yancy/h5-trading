module.exports = {
    setTitle: function(name) {
        var titleEl = $('#J_Title');
        var spanEl = $('<span>' + name + '</span>');

        titleEl.html(spanEl);


        var width = spanEl.width();

        if (width / $(window).width() > 360 / 640) {
            titleEl.addClass('marquee');
            titleEl.html('<marquee>' + name + '</marquee>');
        }
    }
};