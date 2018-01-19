var Scroll = (function(n, r, a) {
    function h(t, i) {
        this.wrapper = "string" == typeof t ? r.querySelector(t) : t,
        this.scroller = this.wrapper.children[0],
        this.scrollerStyle = this.scroller.style,
        this.options = {
            resizeScrollbars: !0,
            mouseWheelSpeed: 20,
            snapThreshold: .334,
            disablePointer: !u.hasPointer,
            disableTouch: u.hasPointer || !u.hasTouch,
            disableMouse: u.hasPointer || u.hasTouch,
            startX: 0,
            startY: 0,
            scrollY: !0,
            directionLockThreshold: 5,
            momentum: !0,
            bounce: !0,
            bounceTime: 600,
            bounceEasing: "",
            preventDefault: !0,
            preventDefaultException: {
                tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/
            },
            HWCompositing: !0,
            useTransition: !0,
            useTransform: !0,
            bindToWrapper: "undefined" == typeof n.onmousedown
        };
        for (var e in i) this.options[e] = i[e];
        this.translateZ = this.options.HWCompositing && u.hasPerspective ? " translateZ(0)": "",
        this.options.useTransition = u.hasTransition && this.options.useTransition,
        this.options.useTransform = u.hasTransform && this.options.useTransform,
        this.options.eventPassthrough = this.options.eventPassthrough === !0 ? "vertical": this.options.eventPassthrough,
        this.options.preventDefault = !this.options.eventPassthrough && this.options.preventDefault,
        this.options.scrollY = "vertical" != this.options.eventPassthrough && this.options.scrollY,
        this.options.scrollX = "horizontal" != this.options.eventPassthrough && this.options.scrollX,
        this.options.freeScroll = this.options.freeScroll && !this.options.eventPassthrough,
        this.options.directionLockThreshold = this.options.eventPassthrough ? 0 : this.options.directionLockThreshold,
        this.options.bounceEasing = "string" == typeof this.options.bounceEasing ? u.ease[this.options.bounceEasing] || u.ease.circular: this.options.bounceEasing,
        this.options.resizePolling = void 0 === this.options.resizePolling ? 60 : this.options.resizePolling,
        this.options.tap === !0 && (this.options.tap = "tap"),
        this.options.useTransition || this.options.useTransform || /relative|absolute/i.test(this.scrollerStyle.position) || (this.scrollerStyle.position = "relative"),
        "scale" == this.options.shrinkScrollbars && (this.options.useTransition = !1),
        this.options.invertWheelDirection = this.options.invertWheelDirection ? -1 : 1,
        3 == this.options.probeType && (this.options.useTransition = !1),
        this.x = 0,
        this.y = 0,
        this.directionX = 0,
        this.directionY = 0,
        this._events = {},
        this._init(),
        this.refresh(),
        this.scrollTo(this.options.startX, this.options.startY),
        this.enable()
    }
    function l(t, i, e) {
        var s = r.createElement("div"),
        o = r.createElement("div");
        return e === !0 && (s.style.cssText = "position:absolute;z-index:9999", o.style.cssText = "-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;position:absolute;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.9);border-radius:3px"),
        o.className = "iScrollIndicator",
        "h" == t ? (e === !0 && (s.style.cssText += ";height:7px;left:2px;right:2px;bottom:0", o.style.height = "100%"), s.className = "iScrollHorizontalScrollbar") : (e === !0 && (s.style.cssText += ";width:7px;bottom:2px;top:2px;right:1px", o.style.width = "100%"), s.className = "iScrollVerticalScrollbar"),
        s.style.cssText += ";overflow:hidden",
        i || (s.style.pointerEvents = "none"),
        s.appendChild(o),
        s
    }
    function c(t, i) {
        this.wrapper = "string" == typeof i.el ? r.querySelector(i.el) : i.el,
        this.wrapperStyle = this.wrapper.style,
        this.indicator = this.wrapper.children[0],
        this.indicatorStyle = this.indicator.style,
        this.scroller = t,
        this.options = {
            listenX: !0,
            listenY: !0,
            interactive: !1,
            resize: !0,
            defaultScrollbars: !1,
            shrink: !1,
            fade: !1,
            speedRatioX: 0,
            speedRatioY: 0
        };
        for (var e in i) this.options[e] = i[e];
        if (this.sizeRatioX = 1, this.sizeRatioY = 1, this.maxPosX = 0, this.maxPosY = 0, this.options.interactive && (this.options.disableTouch || (u.addEvent(this.indicator, "touchstart", this), u.addEvent(n, "touchend", this)), this.options.disablePointer || (u.addEvent(this.indicator, u.prefixPointerEvent("pointerdown"), this), u.addEvent(n, u.prefixPointerEvent("pointerup"), this)), this.options.disableMouse || (u.addEvent(this.indicator, "mousedown", this), u.addEvent(n, "mouseup", this))), this.options.fade) {
            this.wrapperStyle[u.style.transform] = this.scroller.translateZ;
            var s = u.style.transitionDuration;
            if (!s) return;
            this.wrapperStyle[s] = u.isBadAndroid ? "0.0001ms": "0ms";
            var o = this;
            u.isBadAndroid && p(function() {
                "0.0001ms" === o.wrapperStyle[s] && (o.wrapperStyle[s] = "0s")
            }),
            this.wrapperStyle.opacity = "0"
        }
    }
    var p = n.requestAnimationFrame || n.webkitRequestAnimationFrame || n.mozRequestAnimationFrame || n.oRequestAnimationFrame || n.msRequestAnimationFrame ||
    function(t) {
        n.setTimeout(t, 1e3 / 60)
    },
    u = function() {
        function t(t) {
            return s !== !1 && ("" === s ? t: s + t.charAt(0).toUpperCase() + t.substr(1))
        }
        var i = {},
        e = r.createElement("div").style,
        s = function() {
            for (var t, i = ["t", "webkitT", "MozT", "msT", "OT"], s = 0, o = i.length; s < o; s++) if (t = i[s] + "ransform", t in e) return i[s].substr(0, i[s].length - 1);
            return ! 1
        } ();
        i.getTime = Date.now ||
        function() {
            return (new Date).getTime()
        },
        i.extend = function(t, i) {
            for (var e in i) t[e] = i[e]
        },
        i.addEvent = function(t, i, e, s) {
            t.addEventListener(i, e, !!s)
        },
        i.removeEvent = function(t, i, e, s) {
            t.removeEventListener(i, e, !!s)
        },
        i.prefixPointerEvent = function(t) {
            return n.MSPointerEvent ? "MSPointer" + t.charAt(7).toUpperCase() + t.substr(8) : t
        },
        i.momentum = function(t, i, e, s, o, n) {
            var r, h, l = t - i,
            c = a.abs(l) / e;
            return n = void 0 === n ? 6e-4: n,
            r = t + c * c / (2 * n) * (l < 0 ? -1 : 1),
            h = c / n,
            r < s ? (r = o ? s - o / 2.5 * (c / 8) : s, l = a.abs(r - t), h = l / c) : r > 0 && (r = o ? o / 2.5 * (c / 8) : 0, l = a.abs(t) + r, h = l / c),
            {
                destination: a.round(r),
                duration: h
            }
        };
        var h = t("transform");
        return i.extend(i, {
            hasTransform: h !== !1,
            hasPerspective: t("perspective") in e,
            hasTouch: "ontouchstart" in n,
            hasPointer: !(!n.PointerEvent && !n.MSPointerEvent),
            hasTransition: t("transition") in e
        }),
        i.isBadAndroid = function() {
            var t = n.navigator.appVersion;
            if (/Android/.test(t) && !/Chrome\/\d/.test(t)) {
                var i = t.match(/Safari\/(\d+.\d)/);
                return ! (i && "object" === ("undefined" == typeof i ? "undefined": o(i)) && i.length >= 2) || parseFloat(i[1]) < 535.19
            }
            return ! 1
        } (),
        i.extend(i.style = {},
        {
            transform: h,
            transitionTimingFunction: t("transitionTimingFunction"),
            transitionDuration: t("transitionDuration"),
            transitionDelay: t("transitionDelay"),
            transformOrigin: t("transformOrigin"),
            touchAction: t("touchAction")
        }),
        i.hasClass = function(t, i) {
            var e = new RegExp("(^|\\s)" + i + "(\\s|$)");
            return e.test(t.className)
        },
        i.addClass = function(t, e) {
            if (!i.hasClass(t, e)) {
                var s = t.className.split(" ");
                s.push(e),
                t.className = s.join(" ")
            }
        },
        i.removeClass = function(t, e) {
            if (i.hasClass(t, e)) {
                var s = new RegExp("(^|\\s)" + e + "(\\s|$)", "g");
                t.className = t.className.replace(s, " ")
            }
        },
        i.offset = function(t) {
            for (var i = -t.offsetLeft,
            e = -t.offsetTop; t = t.offsetParent;) i -= t.offsetLeft,
            e -= t.offsetTop;
            return {
                left: i,
                top: e
            }
        },
        i.preventDefaultException = function(t, i) {
            for (var e in i) if (i[e].test(t[e])) return ! 0;
            return ! 1
        },
        i.extend(i.eventType = {},
        {
            touchstart: 1,
            touchmove: 1,
            touchend: 1,
            mousedown: 2,
            mousemove: 2,
            mouseup: 2,
            pointerdown: 3,
            pointermove: 3,
            pointerup: 3,
            MSPointerDown: 3,
            MSPointerMove: 3,
            MSPointerUp: 3
        }),
        i.extend(i.ease = {},
        {
            quadratic: {
                style: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                fn: function(t) {
                    return t * (2 - t)
                }
            },
            circular: {
                style: "cubic-bezier(0.1, 0.57, 0.1, 1)",
                fn: function(t) {
                    return a.sqrt(1 - --t * t)
                }
            },
            back: {
                style: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                fn: function(t) {
                    var i = 4;
                    return (t -= 1) * t * ((i + 1) * t + i) + 1
                }
            },
            bounce: {
                style: "",
                fn: function(t) {
                    return (t /= 1) < 1 / 2.75 ? 7.5625 * t * t: t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375
                }
            },
            elastic: {
                style: "",
                fn: function(t) {
                    var i = .22,
                    e = .4;
                    return 0 === t ? 0 : 1 == t ? 1 : e * a.pow(2, -10 * t) * a.sin((t - i / 4) * (2 * a.PI) / i) + 1
                }
            }
        }),
        i.tap = function(t, i) {
            var e = r.createEvent("Event");
            e.initEvent(i, !0, !0),
            e.pageX = t.pageX,
            e.pageY = t.pageY,
            t.target.dispatchEvent(e)
        },
        i.click = function(t) {
            var i, e = t.target;
            /(SELECT|INPUT|TEXTAREA)/i.test(e.tagName) || (i = r.createEvent(n.MouseEvent ? "MouseEvents": "Event"), i.initEvent("click", !0, !0), i.view = t.view || n, i.detail = 1, i.screenX = e.screenX || 0, i.screenY = e.screenY || 0, i.clientX = e.clientX || 0, i.clientY = e.clientY || 0, i.ctrlKey = !!t.ctrlKey, i.altKey = !!t.altKey, i.shiftKey = !!t.shiftKey, i.metaKey = !!t.metaKey, i.button = 0, i.relatedTarget = null, i._constructed = !0, e.dispatchEvent(i))
        },
        i.getTouchAction = function(t, i) {
            var e = "none";
            return "vertical" === t ? e = "pan-y": "horizontal" === t && (e = "pan-x"),
            i && "none" != e && (e += " pinch-zoom"),
            e
        },
        i.getRect = function(t) {
            if (t instanceof SVGElement) {
                var i = t.getBoundingClientRect();
                return {
                    top: i.top,
                    left: i.left,
                    width: i.width,
                    height: i.height
                }
            }
            return {
                top: t.offsetTop,
                left: t.offsetLeft,
                width: t.offsetWidth,
                height: t.offsetHeight
            }
        },
        i
    } ();
    h.prototype = {
        version: "5.2.0-snapshot",
        _init: function() {
            this._initEvents(),
            (this.options.scrollbars || this.options.indicators) && this._initIndicators(),
            this.options.mouseWheel && this._initWheel(),
            this.options.snap && this._initSnap(),
            this.options.keyBindings && this._initKeys()
        },
        destroy: function() {
            this._initEvents(!0),
            clearTimeout(this.resizeTimeout),
            this.resizeTimeout = null,
            this._execEvent("destroy")
        },
        _transitionEnd: function(t) {
            t.target == this.scroller && this.isInTransition && (this._transitionTime(), this.resetPosition(this.options.bounceTime) || (this.isInTransition = !1, this._execEvent("scrollEnd")))
        },
        _start: function(t) {
            if (1 != u.eventType[t.type]) {
                var i;
                if (i = t.which ? t.button: t.button < 2 ? 0 : 4 == t.button ? 1 : 2, 0 !== i) return
            }
            if (this.enabled && (!this.initiated || u.eventType[t.type] === this.initiated)) { ! this.options.preventDefault || u.isBadAndroid || u.preventDefaultException(t.target, this.options.preventDefaultException) || t.preventDefault();
                var e, s = t.touches ? t.touches[0] : t;
                this.initiated = u.eventType[t.type],
                this.moved = !1,
                this.distX = 0,
                this.distY = 0,
                this.directionX = 0,
                this.directionY = 0,
                this.directionLocked = 0,
                this.startTime = u.getTime(),
                this.options.useTransition && this.isInTransition ? (this._transitionTime(), this.isInTransition = !1, e = this.getComputedPosition(), this._translate(a.round(e.x), a.round(e.y)), this._execEvent("scrollEnd")) : !this.options.useTransition && this.isAnimating && (this.isAnimating = !1, this._execEvent("scrollEnd")),
                this.startX = this.x,
                this.startY = this.y,
                this.absStartX = this.x,
                this.absStartY = this.y,
                this.pointX = s.pageX,
                this.pointY = s.pageY,
                this._execEvent("beforeScrollStart")
            }
        },
        _move: function(t) {
            if (this.enabled && u.eventType[t.type] === this.initiated) {
                this.options.preventDefault && t.preventDefault();
                var i, e, s, o, n = t.touches ? t.touches[0] : t,
                r = n.pageX - this.pointX,
                h = n.pageY - this.pointY,
                l = u.getTime();
                if (this.pointX = n.pageX, this.pointY = n.pageY, this.distX += r, this.distY += h, s = a.abs(this.distX), o = a.abs(this.distY), !(l - this.endTime > 300 && s < 10 && o < 10)) {
                    if (this.directionLocked || this.options.freeScroll || (s > o + this.options.directionLockThreshold ? this.directionLocked = "h": o >= s + this.options.directionLockThreshold ? this.directionLocked = "v": this.directionLocked = "n"), "h" == this.directionLocked) {
                        if ("vertical" == this.options.eventPassthrough) t.preventDefault();
                        else if ("horizontal" == this.options.eventPassthrough) return void(this.initiated = !1);
                        h = 0
                    } else if ("v" == this.directionLocked) {
                        if ("horizontal" == this.options.eventPassthrough) t.preventDefault();
                        else if ("vertical" == this.options.eventPassthrough) return void(this.initiated = !1);
                        r = 0
                    }
                    r = this.hasHorizontalScroll ? r: 0,
                    h = this.hasVerticalScroll ? h: 0,
                    i = this.x + r,
                    e = this.y + h,
                    (i > 0 || i < this.maxScrollX) && (i = this.options.bounce ? this.x + r / 3 : i > 0 ? 0 : this.maxScrollX),
                    (e > 0 || e < this.maxScrollY) && (e = this.options.bounce ? this.y + h / 3 : e > 0 ? 0 : this.maxScrollY),
                    this.directionX = r > 0 ? -1 : r < 0 ? 1 : 0,
                    this.directionY = h > 0 ? -1 : h < 0 ? 1 : 0,
                    this.moved || this._execEvent("scrollStart"),
                    this.moved = !0,
                    this._translate(i, e),
                    l - this.startTime > 300 && (this.startTime = l, this.startX = this.x, this.startY = this.y, 1 == this.options.probeType && this._execEvent("scroll")),
                    this.options.probeType > 1 && this._execEvent("scroll")
                }
            }
        },
        _end: function(t) {
            if (this.enabled && u.eventType[t.type] === this.initiated) {
                this.options.preventDefault && !u.preventDefaultException(t.target, this.options.preventDefaultException) && t.preventDefault();
                var i, e, s = (t.changedTouches ? t.changedTouches[0] : t, u.getTime() - this.startTime),
                o = a.round(this.x),
                n = a.round(this.y),
                r = a.abs(o - this.startX),
                h = a.abs(n - this.startY),
                l = 0,
                c = "";
                if (this.isInTransition = 0, this.initiated = 0, this.endTime = u.getTime(), !this.resetPosition(this.options.bounceTime)) {
                    if (this.scrollTo(o, n), !this.moved) return this.options.tap && u.tap(t, this.options.tap),
                    this.options.click && u.click(t),
                    void this._execEvent("scrollCancel");
                    if (this._events.flick && s < 200 && r < 100 && h < 100) return void this._execEvent("flick");
                    if (this.options.momentum && s < 300 && (i = this.hasHorizontalScroll ? u.momentum(this.x, this.startX, s, this.maxScrollX, this.options.bounce ? this.wrapperWidth: 0, this.options.deceleration) : {
                        destination: o,
                        duration: 0
                    },
                    e = this.hasVerticalScroll ? u.momentum(this.y, this.startY, s, this.maxScrollY, this.options.bounce ? this.wrapperHeight: 0, this.options.deceleration) : {
                        destination: n,
                        duration: 0
                    },
                    o = i.destination, n = e.destination, l = a.max(i.duration, e.duration), this.isInTransition = 1), this.options.snap) {
                        var p = this._nearestSnap(o, n);
                        this.currentPage = p,
                        l = this.options.snapSpeed || a.max(a.max(a.min(a.abs(o - p.x), 1e3), a.min(a.abs(n - p.y), 1e3)), 300),
                        o = p.x,
                        n = p.y,
                        this.directionX = 0,
                        this.directionY = 0,
                        c = this.options.bounceEasing
                    }
                    return o != this.x || n != this.y ? ((o > 0 || o < this.maxScrollX || n > 0 || n < this.maxScrollY) && (c = u.ease.quadratic), void this.scrollTo(o, n, l, c)) : void this._execEvent("scrollEnd")
                }
            }
        },
        _resize: function() {
            var t = this;
            clearTimeout(this.resizeTimeout),
            this.resizeTimeout = setTimeout(function() {
                t.refresh()
            },
            this.options.resizePolling)
        },
        resetPosition: function(t) {
            var i = this.x,
            e = this.y;
            return t = t || 0,
            !this.hasHorizontalScroll || this.x > 0 ? i = 0 : this.x < this.maxScrollX && (i = this.maxScrollX),
            !this.hasVerticalScroll || this.y > 0 ? e = 0 : this.y < this.maxScrollY && (e = this.maxScrollY),
            (i != this.x || e != this.y) && (this.scrollTo(i, e, t, this.options.bounceEasing), !0)
        },
        disable: function() {
            this.enabled = !1
        },
        enable: function() {
            this.enabled = !0
        },
        refresh: function() {
            u.getRect(this.wrapper),
            this.wrapperWidth = this.wrapper.clientWidth,
            this.wrapperHeight = this.wrapper.clientHeight;
            var t = u.getRect(this.scroller);
            this.scrollerWidth = t.width,
            this.scrollerHeight = t.height,
            this.maxScrollX = this.wrapperWidth - this.scrollerWidth,
            this.maxScrollY = this.wrapperHeight - this.scrollerHeight,
            this.hasHorizontalScroll = this.options.scrollX && this.maxScrollX < 0,
            this.hasVerticalScroll = this.options.scrollY && this.maxScrollY < 0,
            this.hasHorizontalScroll || (this.maxScrollX = 0, this.scrollerWidth = this.wrapperWidth),
            this.hasVerticalScroll || (this.maxScrollY = 0, this.scrollerHeight = this.wrapperHeight),
            this.endTime = 0,
            this.directionX = 0,
            this.directionY = 0,
            u.hasPointer && !this.options.disablePointer && (this.wrapper.style[u.style.touchAction] = u.getTouchAction(this.options.eventPassthrough, !0), this.wrapper.style[u.style.touchAction] || (this.wrapper.style[u.style.touchAction] = u.getTouchAction(this.options.eventPassthrough, !1))),
            this.wrapperOffset = u.offset(this.wrapper),
            this._execEvent("refresh"),
            this.resetPosition()
        },
        on: function(t, i) {
            this._events[t] || (this._events[t] = []),
            this._events[t].push(i)
        },
        off: function(t, i) {
            if (this._events[t]) {
                var e = this._events[t].indexOf(i);
                e > -1 && this._events[t].splice(e, 1)
            }
        },
        _execEvent: function(t) {
            if (this._events[t]) {
                var i = 0,
                e = this._events[t].length;
                if (e) for (; i < e; i++) this._events[t][i].apply(this, [].slice.call(arguments, 1))
            }
        },
        scrollBy: function(t, i, e, s) {
            t = this.x + t,
            i = this.y + i,
            e = e || 0,
            this.scrollTo(t, i, e, s)
        },
        scrollTo: function(t, i, e, s) {
            s = s || u.ease.circular,
            this.isInTransition = this.options.useTransition && e > 0;
            var o = this.options.useTransition && s.style; ! e || o ? (o && (this._transitionTimingFunction(s.style), this._transitionTime(e)), this._translate(t, i)) : this._animate(t, i, e, s.fn)
        },
        scrollToElement: function(t, i, e, s, o) {
            if (t = t.nodeType ? t: this.scroller.querySelector(t)) {
                var n = u.offset(t);
                n.left -= this.wrapperOffset.left,
                n.top -= this.wrapperOffset.top;
                var r = u.getRect(t),
                h = u.getRect(this.wrapper);
                e === !0 && (e = a.round(r.width / 2 - h.width / 2)),
                s === !0 && (s = a.round(r.height / 2 - h.height / 2)),
                n.left -= e || 0,
                n.top -= s || 0,
                n.left = n.left > 0 ? 0 : n.left < this.maxScrollX ? this.maxScrollX: n.left,
                n.top = n.top > 0 ? 0 : n.top < this.maxScrollY ? this.maxScrollY: n.top,
                i = void 0 === i || null === i || "auto" === i ? a.max(a.abs(this.x - n.left), a.abs(this.y - n.top)) : i,
                this.scrollTo(n.left, n.top, i, o)
            }
        },
        _transitionTime: function(t) {
            if (this.options.useTransition) {
                t = t || 0;
                var i = u.style.transitionDuration;
                if (i) {
                    if (this.scrollerStyle[i] = t + "ms", !t && u.isBadAndroid) {
                        this.scrollerStyle[i] = "0.0001ms";
                        var e = this;
                        p(function() {
                            "0.0001ms" === e.scrollerStyle[i] && (e.scrollerStyle[i] = "0s")
                        })
                    }
                    if (this.indicators) for (var s = this.indicators.length; s--;) this.indicators[s].transitionTime(t)
                }
            }
        },
        _transitionTimingFunction: function(t) {
            if (this.scrollerStyle[u.style.transitionTimingFunction] = t, this.indicators) for (var i = this.indicators.length; i--;) this.indicators[i].transitionTimingFunction(t)
        },
        _translate: function(t, i) {
            if (this.options.useTransform ? this.scrollerStyle[u.style.transform] = "translate(" + t + "px," + i + "px)" + this.translateZ: (t = a.round(t), i = a.round(i), this.scrollerStyle.left = t + "px", this.scrollerStyle.top = i + "px"), this.x = t, this.y = i, this.indicators) for (var e = this.indicators.length; e--;) this.indicators[e].updatePosition()
        },
        _initEvents: function(t) {
            var i = t ? u.removeEvent: u.addEvent,
            e = this.options.bindToWrapper ? this.wrapper: n;
            i(n, "orientationchange", this),
            i(n, "resize", this),
            this.options.click && i(this.wrapper, "click", this, !0),
            this.options.disableMouse || (i(this.wrapper, "mousedown", this), i(e, "mousemove", this), i(e, "mousecancel", this), i(e, "mouseup", this)),
            u.hasPointer && !this.options.disablePointer && (i(this.wrapper, u.prefixPointerEvent("pointerdown"), this), i(e, u.prefixPointerEvent("pointermove"), this), i(e, u.prefixPointerEvent("pointercancel"), this), i(e, u.prefixPointerEvent("pointerup"), this)),
            u.hasTouch && !this.options.disableTouch && (i(this.wrapper, "touchstart", this), i(e, "touchmove", this), i(e, "touchcancel", this), i(e, "touchend", this)),
            i(this.scroller, "transitionend", this),
            i(this.scroller, "webkitTransitionEnd", this),
            i(this.scroller, "oTransitionEnd", this),
            i(this.scroller, "MSTransitionEnd", this)
        },
        getComputedPosition: function() {
            var t, i, e = n.getComputedStyle(this.scroller, null);
            return this.options.useTransform ? (e = e[u.style.transform].split(")")[0].split(", "), t = +(e[12] || e[4]), i = +(e[13] || e[5])) : (t = +e.left.replace(/[^-\d.]/g, ""), i = +e.top.replace(/[^-\d.]/g, "")),
            {
                x: t,
                y: i
            }
        },
        _initIndicators: function() {
            function t(t) {
                if (n.indicators) for (var i = n.indicators.length; i--;) t.call(n.indicators[i])
            }
            var i, e = this.options.interactiveScrollbars,
            s = "string" != typeof this.options.scrollbars,
            o = [],
            n = this;
            this.indicators = [],
            this.options.scrollbars && (this.options.scrollY && (i = {
                el: l("v", e, this.options.scrollbars),
                interactive: e,
                defaultScrollbars: !0,
                customStyle: s,
                resize: this.options.resizeScrollbars,
                shrink: this.options.shrinkScrollbars,
                fade: this.options.fadeScrollbars,
                listenX: !1
            },
            this.wrapper.appendChild(i.el), o.push(i)), this.options.scrollX && (i = {
                el: l("h", e, this.options.scrollbars),
                interactive: e,
                defaultScrollbars: !0,
                customStyle: s,
                resize: this.options.resizeScrollbars,
                shrink: this.options.shrinkScrollbars,
                fade: this.options.fadeScrollbars,
                listenY: !1
            },
            this.wrapper.appendChild(i.el), o.push(i))),
            this.options.indicators && (o = o.concat(this.options.indicators));
            for (var r = o.length; r--;) this.indicators.push(new c(this, o[r]));
            this.options.fadeScrollbars && (this.on("scrollEnd",
            function() {
                t(function() {
                    this.fade()
                })
            }), this.on("scrollCancel",
            function() {
                t(function() {
                    this.fade()
                })
            }), this.on("scrollStart",
            function() {
                t(function() {
                    this.fade(1)
                })
            }), this.on("beforeScrollStart",
            function() {
                t(function() {
                    this.fade(1, !0)
                })
            })),
            this.on("refresh",
            function() {
                t(function() {
                    this.refresh()
                })
            }),
            this.on("destroy",
            function() {
                t(function() {
                    this.destroy()
                }),
                delete this.indicators
            })
        },
        _initWheel: function() {
            u.addEvent(this.wrapper, "wheel", this),
            u.addEvent(this.wrapper, "mousewheel", this),
            u.addEvent(this.wrapper, "DOMMouseScroll", this),
            this.on("destroy",
            function() {
                clearTimeout(this.wheelTimeout),
                this.wheelTimeout = null,
                u.removeEvent(this.wrapper, "wheel", this),
                u.removeEvent(this.wrapper, "mousewheel", this),
                u.removeEvent(this.wrapper, "DOMMouseScroll", this)
            })
        },
        _wheel: function(t) {
            if (this.enabled) {
                t.preventDefault();
                var i, e, s, o, n = this;
                if (void 0 === this.wheelTimeout && n._execEvent("scrollStart"), clearTimeout(this.wheelTimeout), this.wheelTimeout = setTimeout(function() {
                    n.options.snap || n._execEvent("scrollEnd"),
                    n.wheelTimeout = void 0
                },
                400), "deltaX" in t) 1 === t.deltaMode ? (i = -t.deltaX * this.options.mouseWheelSpeed, e = -t.deltaY * this.options.mouseWheelSpeed) : (i = -t.deltaX, e = -t.deltaY);
                else if ("wheelDeltaX" in t) i = t.wheelDeltaX / 120 * this.options.mouseWheelSpeed,
                e = t.wheelDeltaY / 120 * this.options.mouseWheelSpeed;
                else if ("wheelDelta" in t) i = e = t.wheelDelta / 120 * this.options.mouseWheelSpeed;
                else {
                    if (! ("detail" in t)) return;
                    i = e = -t.detail / 3 * this.options.mouseWheelSpeed
                }
                if (i *= this.options.invertWheelDirection, e *= this.options.invertWheelDirection, this.hasVerticalScroll || (i = e, e = 0), this.options.snap) return s = this.currentPage.pageX,
                o = this.currentPage.pageY,
                i > 0 ? s--:i < 0 && s++,
                e > 0 ? o--:e < 0 && o++,
                void this.goToPage(s, o);
                s = this.x + a.round(this.hasHorizontalScroll ? i: 0),
                o = this.y + a.round(this.hasVerticalScroll ? e: 0),
                this.directionX = i > 0 ? -1 : i < 0 ? 1 : 0,
                this.directionY = e > 0 ? -1 : e < 0 ? 1 : 0,
                s > 0 ? s = 0 : s < this.maxScrollX && (s = this.maxScrollX),
                o > 0 ? o = 0 : o < this.maxScrollY && (o = this.maxScrollY),
                this.scrollTo(s, o, 0),
                this.options.probeType > 1 && this._execEvent("scroll")
            }
        },
        _initSnap: function() {
            this.currentPage = {},
            "string" == typeof this.options.snap && (this.options.snap = this.scroller.querySelectorAll(this.options.snap)),
            this.on("refresh",
            function() {
                var t, i, e, s, o, n, r, h = 0,
                l = 0,
                c = 0,
                p = this.options.snapStepX || this.wrapperWidth,
                d = this.options.snapStepY || this.wrapperHeight;
                if (this.pages = [], this.wrapperWidth && this.wrapperHeight && this.scrollerWidth && this.scrollerHeight) {
                    if (this.options.snap === !0) for (e = a.round(p / 2), s = a.round(d / 2); c > -this.scrollerWidth;) {
                        for (this.pages[h] = [], t = 0, o = 0; o > -this.scrollerHeight;) this.pages[h][t] = {
                            x: a.max(c, this.maxScrollX),
                            y: a.max(o, this.maxScrollY),
                            width: p,
                            height: d,
                            cx: c - e,
                            cy: o - s
                        },
                        o -= d,
                        t++;
                        c -= p,
                        h++
                    } else for (n = this.options.snap, t = n.length, i = -1; h < t; h++) r = u.getRect(n[h]),
                    (0 === h || r.left <= u.getRect(n[h - 1]).left) && (l = 0, i++),
                    this.pages[l] || (this.pages[l] = []),
                    c = a.max( - r.left, this.maxScrollX),
                    o = a.max( - r.top, this.maxScrollY),
                    e = c - a.round(r.width / 2),
                    s = o - a.round(r.height / 2),
                    this.pages[l][i] = {
                        x: c,
                        y: o,
                        width: r.width,
                        height: r.height,
                        cx: e,
                        cy: s
                    },
                    c > this.maxScrollX && l++;
                    this.goToPage(this.currentPage.pageX || 0, this.currentPage.pageY || 0, 0),
                    this.options.snapThreshold % 1 === 0 ? (this.snapThresholdX = this.options.snapThreshold, this.snapThresholdY = this.options.snapThreshold) : (this.snapThresholdX = a.round(this.pages[this.currentPage.pageX][this.currentPage.pageY].width * this.options.snapThreshold), this.snapThresholdY = a.round(this.pages[this.currentPage.pageX][this.currentPage.pageY].height * this.options.snapThreshold))
                }
            }),
            this.on("flick",
            function() {
                var t = this.options.snapSpeed || a.max(a.max(a.min(a.abs(this.x - this.startX), 1e3), a.min(a.abs(this.y - this.startY), 1e3)), 300);
                this.goToPage(this.currentPage.pageX + this.directionX, this.currentPage.pageY + this.directionY, t)
            })
        },
        _nearestSnap: function(t, i) {
            if (!this.pages.length) return {
                x: 0,
                y: 0,
                pageX: 0,
                pageY: 0
            };
            var e = 0,
            s = this.pages.length,
            o = 0;
            if (a.abs(t - this.absStartX) < this.snapThresholdX && a.abs(i - this.absStartY) < this.snapThresholdY) return this.currentPage;
            for (t > 0 ? t = 0 : t < this.maxScrollX && (t = this.maxScrollX), i > 0 ? i = 0 : i < this.maxScrollY && (i = this.maxScrollY); e < s; e++) if (t >= this.pages[e][0].cx) {
                t = this.pages[e][0].x;
                break
            }
            for (s = this.pages[e].length; o < s; o++) if (i >= this.pages[0][o].cy) {
                i = this.pages[0][o].y;
                break
            }
            return e == this.currentPage.pageX && (e += this.directionX, e < 0 ? e = 0 : e >= this.pages.length && (e = this.pages.length - 1), t = this.pages[e][0].x),
            o == this.currentPage.pageY && (o += this.directionY, o < 0 ? o = 0 : o >= this.pages[0].length && (o = this.pages[0].length - 1), i = this.pages[0][o].y),
            {
                x: t,
                y: i,
                pageX: e,
                pageY: o
            }
        },
        goToPage: function(t, i, e, s) {
            s = s || this.options.bounceEasing,
            t >= this.pages.length ? t = this.pages.length - 1 : t < 0 && (t = 0),
            i >= this.pages[t].length ? i = this.pages[t].length - 1 : i < 0 && (i = 0);
            var o = this.pages[t][i].x,
            n = this.pages[t][i].y;
            e = void 0 === e ? this.options.snapSpeed || a.max(a.max(a.min(a.abs(o - this.x), 1e3), a.min(a.abs(n - this.y), 1e3)), 300) : e,
            this.currentPage = {
                x: o,
                y: n,
                pageX: t,
                pageY: i
            },
            this.scrollTo(o, n, e, s)
        },
        next: function(t, i) {
            var e = this.currentPage.pageX,
            s = this.currentPage.pageY;
            e++,
            e >= this.pages.length && this.hasVerticalScroll && (e = 0, s++),
            this.goToPage(e, s, t, i)
        },
        prev: function(t, i) {
            var e = this.currentPage.pageX,
            s = this.currentPage.pageY;
            e--,
            e < 0 && this.hasVerticalScroll && (e = 0, s--),
            this.goToPage(e, s, t, i)
        },
        _initKeys: function(t) {
            var i, e = {
                pageUp: 33,
                pageDown: 34,
                end: 35,
                home: 36,
                left: 37,
                up: 38,
                right: 39,
                down: 40
            };
            if ("object" == o(this.options.keyBindings)) for (i in this.options.keyBindings)"string" == typeof this.options.keyBindings[i] && (this.options.keyBindings[i] = this.options.keyBindings[i].toUpperCase().charCodeAt(0));
            else this.options.keyBindings = {};
            for (i in e) this.options.keyBindings[i] = this.options.keyBindings[i] || e[i];
            u.addEvent(n, "keydown", this),
            this.on("destroy",
            function() {
                u.removeEvent(n, "keydown", this)
            })
        },
        _key: function(t) {
            if (this.enabled) {
                var i, e = this.options.snap,
                s = e ? this.currentPage.pageX: this.x,
                o = e ? this.currentPage.pageY: this.y,
                n = u.getTime(),
                r = this.keyTime || 0,
                h = .25;
                switch (this.options.useTransition && this.isInTransition && (i = this.getComputedPosition(), this._translate(a.round(i.x), a.round(i.y)), this.isInTransition = !1), this.keyAcceleration = n - r < 200 ? a.min(this.keyAcceleration + h, 50) : 0, t.keyCode) {
                case this.options.keyBindings.pageUp:
                    this.hasHorizontalScroll && !this.hasVerticalScroll ? s += e ? 1 : this.wrapperWidth: o += e ? 1 : this.wrapperHeight;
                    break;
                case this.options.keyBindings.pageDown:
                    this.hasHorizontalScroll && !this.hasVerticalScroll ? s -= e ? 1 : this.wrapperWidth: o -= e ? 1 : this.wrapperHeight;
                    break;
                case this.options.keyBindings.end:
                    s = e ? this.pages.length - 1 : this.maxScrollX,
                    o = e ? this.pages[0].length - 1 : this.maxScrollY;
                    break;
                case this.options.keyBindings.home:
                    s = 0,
                    o = 0;
                    break;
                case this.options.keyBindings.left:
                    s += e ? -1 : 5 + this.keyAcceleration >> 0;
                    break;
                case this.options.keyBindings.up:
                    o += e ? 1 : 5 + this.keyAcceleration >> 0;
                    break;
                case this.options.keyBindings.right:
                    s -= e ? -1 : 5 + this.keyAcceleration >> 0;
                    break;
                case this.options.keyBindings.down:
                    o -= e ? 1 : 5 + this.keyAcceleration >> 0;
                    break;
                default:
                    return
                }
                if (e) return void this.goToPage(s, o);
                s > 0 ? (s = 0, this.keyAcceleration = 0) : s < this.maxScrollX && (s = this.maxScrollX, this.keyAcceleration = 0),
                o > 0 ? (o = 0, this.keyAcceleration = 0) : o < this.maxScrollY && (o = this.maxScrollY, this.keyAcceleration = 0),
                this.scrollTo(s, o, 0),
                this.keyTime = n
            }
        },
        _animate: function(t, i, e, s) {
            function o() {
                var c, d, f, m = u.getTime();
                return m >= l ? (n.isAnimating = !1, n._translate(t, i), void(n.resetPosition(n.options.bounceTime) || n._execEvent("scrollEnd"))) : (m = (m - h) / e, f = s(m), c = (t - r) * f + r, d = (i - a) * f + a, n._translate(c, d), n.isAnimating && p(o), void(3 == n.options.probeType && n._execEvent("scroll")))
            }
            var n = this,
            r = this.x,
            a = this.y,
            h = u.getTime(),
            l = h + e;
            this.isAnimating = !0,
            o()
        },
        handleEvent: function(t) {
            switch (t.type) {
            case "touchstart":
            case "pointerdown":
            case "MSPointerDown":
            case "mousedown":
                this._start(t);
                break;
            case "touchmove":
            case "pointermove":
            case "MSPointerMove":
            case "mousemove":
                this._move(t);
                break;
            case "touchend":
            case "pointerup":
            case "MSPointerUp":
            case "mouseup":
            case "touchcancel":
            case "pointercancel":
            case "MSPointerCancel":
            case "mousecancel":
                this._end(t);
                break;
            case "orientationchange":
            case "resize":
                this._resize();
                break;
            case "transitionend":
            case "webkitTransitionEnd":
            case "oTransitionEnd":
            case "MSTransitionEnd":
                this._transitionEnd(t);
                break;
            case "wheel":
            case "DOMMouseScroll":
            case "mousewheel":
                this._wheel(t);
                break;
            case "keydown":
                this._key(t);
                break;
            case "click":
                this.enabled && !t._constructed && (t.preventDefault(), t.stopPropagation())
            }
        }
    },
    c.prototype = {
        handleEvent: function(t) {
            switch (t.type) {
            case "touchstart":
            case "pointerdown":
            case "MSPointerDown":
            case "mousedown":
                this._start(t);
                break;
            case "touchmove":
            case "pointermove":
            case "MSPointerMove":
            case "mousemove":
                this._move(t);
                break;
            case "touchend":
            case "pointerup":
            case "MSPointerUp":
            case "mouseup":
            case "touchcancel":
            case "pointercancel":
            case "MSPointerCancel":
            case "mousecancel":
                this._end(t)
            }
        },
        destroy: function() {
            this.options.fadeScrollbars && (clearTimeout(this.fadeTimeout), this.fadeTimeout = null),
            this.options.interactive && (u.removeEvent(this.indicator, "touchstart", this), u.removeEvent(this.indicator, u.prefixPointerEvent("pointerdown"), this), u.removeEvent(this.indicator, "mousedown", this), u.removeEvent(n, "touchmove", this), u.removeEvent(n, u.prefixPointerEvent("pointermove"), this), u.removeEvent(n, "mousemove", this), u.removeEvent(n, "touchend", this), u.removeEvent(n, u.prefixPointerEvent("pointerup"), this), u.removeEvent(n, "mouseup", this)),
            this.options.defaultScrollbars && this.wrapper.parentNode && this.wrapper.parentNode.removeChild(this.wrapper)
        },
        _start: function(t) {
            var i = t.touches ? t.touches[0] : t;
            t.preventDefault(),
            t.stopPropagation(),
            this.transitionTime(),
            this.initiated = !0,
            this.moved = !1,
            this.lastPointX = i.pageX,
            this.lastPointY = i.pageY,
            this.startTime = u.getTime(),
            this.options.disableTouch || u.addEvent(n, "touchmove", this),
            this.options.disablePointer || u.addEvent(n, u.prefixPointerEvent("pointermove"), this),
            this.options.disableMouse || u.addEvent(n, "mousemove", this),
            this.scroller._execEvent("beforeScrollStart")
        },
        _move: function(t) {
            var i, e, s, o, n = t.touches ? t.touches[0] : t,
            r = u.getTime();
            this.moved || this.scroller._execEvent("scrollStart"),
            this.moved = !0,
            i = n.pageX - this.lastPointX,
            this.lastPointX = n.pageX,
            e = n.pageY - this.lastPointY,
            this.lastPointY = n.pageY,
            s = this.x + i,
            o = this.y + e,
            this._pos(s, o),
            1 == this.scroller.options.probeType && r - this.startTime > 300 ? (this.startTime = r, this.scroller._execEvent("scroll")) : this.scroller.options.probeType > 1 && this.scroller._execEvent("scroll"),
            t.preventDefault(),
            t.stopPropagation()
        },
        _end: function(t) {
            if (this.initiated) {
                if (this.initiated = !1, t.preventDefault(), t.stopPropagation(), u.removeEvent(n, "touchmove", this), u.removeEvent(n, u.prefixPointerEvent("pointermove"), this), u.removeEvent(n, "mousemove", this), this.scroller.options.snap) {
                    var i = this.scroller._nearestSnap(this.scroller.x, this.scroller.y),
                    e = this.options.snapSpeed || a.max(a.max(a.min(a.abs(this.scroller.x - i.x), 1e3), a.min(a.abs(this.scroller.y - i.y), 1e3)), 300);
                    this.scroller.x == i.x && this.scroller.y == i.y || (this.scroller.directionX = 0, this.scroller.directionY = 0, this.scroller.currentPage = i, this.scroller.scrollTo(i.x, i.y, e, this.scroller.options.bounceEasing))
                }
                this.moved && this.scroller._execEvent("scrollEnd")
            }
        },
        transitionTime: function(t) {
            t = t || 0;
            var i = u.style.transitionDuration;
            if (i && (this.indicatorStyle[i] = t + "ms", !t && u.isBadAndroid)) {
                this.indicatorStyle[i] = "0.0001ms";
                var e = this;
                p(function() {
                    "0.0001ms" === e.indicatorStyle[i] && (e.indicatorStyle[i] = "0s")
                })
            }
        },
        transitionTimingFunction: function(t) {
            this.indicatorStyle[u.style.transitionTimingFunction] = t
        },
        refresh: function() {
            this.transitionTime(),
            this.options.listenX && !this.options.listenY ? this.indicatorStyle.display = this.scroller.hasHorizontalScroll ? "block": "none": this.options.listenY && !this.options.listenX ? this.indicatorStyle.display = this.scroller.hasVerticalScroll ? "block": "none": this.indicatorStyle.display = this.scroller.hasHorizontalScroll || this.scroller.hasVerticalScroll ? "block": "none",
            this.scroller.hasHorizontalScroll && this.scroller.hasVerticalScroll ? (u.addClass(this.wrapper, "iScrollBothScrollbars"), u.removeClass(this.wrapper, "iScrollLoneScrollbar"), this.options.defaultScrollbars && this.options.customStyle && (this.options.listenX ? this.wrapper.style.right = "8px": this.wrapper.style.bottom = "8px")) : (u.removeClass(this.wrapper, "iScrollBothScrollbars"), u.addClass(this.wrapper, "iScrollLoneScrollbar"), this.options.defaultScrollbars && this.options.customStyle && (this.options.listenX ? this.wrapper.style.right = "2px": this.wrapper.style.bottom = "2px")),
            u.getRect(this.wrapper),
            this.options.listenX && (this.wrapperWidth = this.wrapper.clientWidth, this.options.resize ? (this.indicatorWidth = a.max(a.round(this.wrapperWidth * this.wrapperWidth / (this.scroller.scrollerWidth || this.wrapperWidth || 1)), 8), this.indicatorStyle.width = this.indicatorWidth + "px") : this.indicatorWidth = this.indicator.clientWidth, this.maxPosX = this.wrapperWidth - this.indicatorWidth, "clip" == this.options.shrink ? (this.minBoundaryX = -this.indicatorWidth + 8, this.maxBoundaryX = this.wrapperWidth - 8) : (this.minBoundaryX = 0, this.maxBoundaryX = this.maxPosX), this.sizeRatioX = this.options.speedRatioX || this.scroller.maxScrollX && this.maxPosX / this.scroller.maxScrollX),
            this.options.listenY && (this.wrapperHeight = this.wrapper.clientHeight, this.options.resize ? (this.indicatorHeight = a.max(a.round(this.wrapperHeight * this.wrapperHeight / (this.scroller.scrollerHeight || this.wrapperHeight || 1)), 8), this.indicatorStyle.height = this.indicatorHeight + "px") : this.indicatorHeight = this.indicator.clientHeight, this.maxPosY = this.wrapperHeight - this.indicatorHeight, "clip" == this.options.shrink ? (this.minBoundaryY = -this.indicatorHeight + 8, this.maxBoundaryY = this.wrapperHeight - 8) : (this.minBoundaryY = 0, this.maxBoundaryY = this.maxPosY), this.maxPosY = this.wrapperHeight - this.indicatorHeight, this.sizeRatioY = this.options.speedRatioY || this.scroller.maxScrollY && this.maxPosY / this.scroller.maxScrollY),
            this.updatePosition()
        },
        updatePosition: function() {
            var t = this.options.listenX && a.round(this.sizeRatioX * this.scroller.x) || 0,
            i = this.options.listenY && a.round(this.sizeRatioY * this.scroller.y) || 0;
            this.options.ignoreBoundaries || (t < this.minBoundaryX ? ("scale" == this.options.shrink && (this.width = a.max(this.indicatorWidth + t, 8), this.indicatorStyle.width = this.width + "px"), t = this.minBoundaryX) : t > this.maxBoundaryX ? "scale" == this.options.shrink ? (this.width = a.max(this.indicatorWidth - (t - this.maxPosX), 8), this.indicatorStyle.width = this.width + "px", t = this.maxPosX + this.indicatorWidth - this.width) : t = this.maxBoundaryX: "scale" == this.options.shrink && this.width != this.indicatorWidth && (this.width = this.indicatorWidth, this.indicatorStyle.width = this.width + "px"), i < this.minBoundaryY ? ("scale" == this.options.shrink && (this.height = a.max(this.indicatorHeight + 3 * i, 8), this.indicatorStyle.height = this.height + "px"), i = this.minBoundaryY) : i > this.maxBoundaryY ? "scale" == this.options.shrink ? (this.height = a.max(this.indicatorHeight - 3 * (i - this.maxPosY), 8), this.indicatorStyle.height = this.height + "px", i = this.maxPosY + this.indicatorHeight - this.height) : i = this.maxBoundaryY: "scale" == this.options.shrink && this.height != this.indicatorHeight && (this.height = this.indicatorHeight, this.indicatorStyle.height = this.height + "px")),
            this.x = t,
            this.y = i,
            this.scroller.options.useTransform ? this.indicatorStyle[u.style.transform] = "translate(" + t + "px," + i + "px)" + this.scroller.translateZ: (this.indicatorStyle.left = t + "px", this.indicatorStyle.top = i + "px")
        },
        _pos: function(t, i) {
            t < 0 ? t = 0 : t > this.maxPosX && (t = this.maxPosX),
            i < 0 ? i = 0 : i > this.maxPosY && (i = this.maxPosY),
            t = this.options.listenX ? a.round(t / this.sizeRatioX) : this.scroller.x,
            i = this.options.listenY ? a.round(i / this.sizeRatioY) : this.scroller.y,
            this.scroller.scrollTo(t, i)
        },
        fade: function(t, i) {
            if (!i || this.visible) {
                clearTimeout(this.fadeTimeout),
                this.fadeTimeout = null;
                var e = t ? 250 : 500,
                s = t ? 0 : 300;
                t = t ? "1": "0",
                this.wrapperStyle[u.style.transitionDuration] = e + "ms",
                this.fadeTimeout = setTimeout(function(t) {
                    this.wrapperStyle.opacity = t,
                    this.visible = +t
                }.bind(this, t), s)
            }
        }
    },
    h.utils = u;
    return h;
})(window, document, Math);

module.exports = Scroll;