var win = $(window);
var Sticky = function(config) {
    var nav = $(config.el);
    var self = this;
    nav.css({
        position: '-webkit-sticky',
        top: 0,
        zIndex: 10,
        width:'100%'
    });

    if ((nav.length > 0) && nav.css("position").indexOf("sticky") == -1) {
        self.nav = nav;
        self.setPlaceHolder();
        var scrollTop = nav.offset().top;
        var placeHolder = self.placeHolder;
        var RAF = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
            function(c) {
                setTimeout(c, 1 / 60 * 1000);
            };

        var CAF = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.clearTimeout;

        function timeHandler() {
            if (win.scrollTop() > scrollTop) {
                placeHolder.show();
                nav.css('position', 'fixed');
            } else {
                placeHolder.hide();
                nav.css('position', 'static');
            }
        }

        win.on("scroll", function() {
            RAF(timeHandler);
        });
    }
};

Sticky.prototype.setPlaceHolder = function() {
    var nav = this.nav;
    var marginTop = nav.css('margin-top'),
        marginBottom = nav.css('margin-bottom'),
        height = nav.height();
    var placeHolder = $('<div style="height: ' + height + 'px;margin-top:' + marginTop + ';margin-bottom:' + marginBottom + ';display:none;"></div>');
    nav.before(placeHolder);
    this.placeHolder = placeHolder;
}



$.fn.sticky = function(config) {
    
    config = config || {};
    //node节点
    config.el = this;

    return new Sticky(config);
    
};

module.exports = Sticky;