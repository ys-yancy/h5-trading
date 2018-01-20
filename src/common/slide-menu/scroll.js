var Base = require('../../app/base');

function Scroll() {
    Scroll.superclass.constructor.apply(this, arguments);
    this.init();
}

Base.extend(Scroll, Base, {
    init: function (h) {
        var c = this;
        this.scrollRootHeight = 0;
        var e = document.documentElement.clientHeight;
        var m = $("#" + c.rootListUlId).height();
        var g = $("#" + c.rootRrapperId).height();
        if (g < m) {
            this.scrollRootHeight = m - g;
        }
        this.rootTouchObj = {
            startY: 0,
            scrollY: 0
        };
        this.rootTouchBind();
    },
    rootTouchBind: function () {
        var c = this;
        $("#" + c.rootListUlId).on("touchstart", function (d) {
            c.rootTouchObj.startY = d.touches[0].clientY;
            c.rootTouchObj.scrollY = 0
        });

        $("#" + c.rootListUlId).on("touchmove", function (g) {
            g.preventDefault();
            var h = g.touches;
            var f = g.touches[0].clientY;
            var i = f - c.rootTouchObj.startY;
            var d = 0;
            var e = c.getY(c.rootListUlId);
            d = e + i;
            if (d > 250) {
                d = 250;
            } else {
                if (d < (c.scrollRootHeight * -1 - 0)) {
                    d = (c.scrollRootHeight * -1 - 0);
                    
                }
            }

            $("#" + c.rootListUlId).css("transform", "translateY(" + d + "px)");
            $("#" + c.rootListUlId).css("-webkit-transform", "translateY(" + d + "px)");
            c.rootTouchObj.scrollY = f - c.rootTouchObj.startY;
            c.rootTouchObj.startY = f
        });
        $("#" + c.rootListUlId).on("touchend", function (d) {
            c.touchScroll(c.rootTouchObj.scrollY, c.rootListUlId, c.scrollRootHeight)
        })
    },
    rootTouchUnBind: function () {
        var c = this;
        $("#" + c.rootListUlId).off()
    },

    setScrollRootHeight: function(height) {
        this.scrollRootHeight = height;
    },

    touchScroll: function (k, d, m, g) {
        var c = this;
        var e = Math.abs(k);
        var h = 0;
        var f = 200;
        var l = d;
        var j = 0;
        if (e >= 40) {
            h = 15
        } else {
            if (e < 40 && e >= 25) {
                h = 10
            } else {
                if (e < 25 && e >= 10) {
                    h = 5
                } else {
                    h = 0
                }
            }
        }
        if (h > 0) {
            if (k < 0) {
                h = h * -1
            }
            clearTimeout(this.timer1);
            this.timer1 = setTimeout(function () {
                c.touchScrollRun(h, d, 0, m, g)
            }, 1)
        } else {
            var i = 0;
            i = c.getY(d);
            c.goToEnd(i, d, m)
        }
    },
    touchScrollRun: function (h, k, g, e, f) {
        var i = this;
        var j = g + 1;
        if (g < 40) {
            var d = 0;
            d = i.getY(k) + h;
            $("#" + k).css("transform", "translateY(" + d + "px)");
            $("#" + k).css("-webkit-transform", "translateY(" + d + "px)");
            if (d <= (e * -1 - 30) || d >= 30) {
                i.goToEnd(d, k, e)
            } else {
                clearTimeout(this.timer2);
                this.timer2 = setTimeout(function () {
                    i.touchScrollRun(h, k, j, e, f)
                }, 1)
            }
        } else {
            i.goToEnd(d, k, e)
        }
    },
    goToEnd: function (c, h, e) {
        var g = this;
        var f = null;
        var d = null;
        if (e > 0) {
            if (c < (e * -1)) {
                f = {
                    transform: "translateY(" + (e * -1) + "px)",
                    "-webkit-transform": "translateY(" + (e * -1) + "px)",
                    "-webkit-transition": "0.3s ease 0s",
                    transition: "0.3s ease 0s"
                };
                d = {
                    transform: "translateY(" + (e * -1) + "px)",
                    "-webkit-transform": "translateY(" + (e * -1) + "px)",
                    "-webkit-transition": "",
                    transition: ""
                }
            } else {
                if (c > 0) {
                    f = {
                        transform: "translateY(-0.1px)",
                        "-webkit-transform": "translateY(-0.1px)",
                        "-webkit-transition": "0.3s ease 0s",
                        transition: "0.3s ease 0s"
                    };
                    d = {
                        transform: "translateY(-0.1px)",
                        "-webkit-transform": "translateY(-0.1px)",
                        "-webkit-transition": "",
                        transition: ""
                    }
                }
            }
        }
        if (c != 0) {
            $("#" + h).css(f);
            setTimeout(function () {
                $("#" + h).css(d)
            }, 300);
            return true
        } else {
            $("#" + h).css({
                transform: "translateY(0px)"
            });
            $("#" + h).css({
                "-webkit-transform": "translateY(0px)"
            });
            return false
        }
    },
    getY: function (e) {
        var d = this;
        var c = $("#" + e).css("transform");
        if (!c) {
            c = $("#" + e).css("-webkit-transform")
        }
        if (c == "none") {
            c = 0
        } else {
            c = c.replace("translateY(", "").replace(")", "");
            c = parseInt(c, 10)
        }
        if (!c) {
            c = 0
        }
        return c
    }
})

module.exports = Scroll;