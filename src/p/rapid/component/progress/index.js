var FALSE = false;
sessionStorage.setItem('buyData', JSON.stringify({
  lowestInvestAmount: 5
}));

'use strict';

var Base = require('../../../../app/base');
var Config = require('../../../../app/config');
var Toast = require('../../../../common/toast');
var CountP = require('./progress');
var N = Config.getStep();

export default class Progress extends Base {
  constructor(config) {
    super();

    this.countP = new CountP({
      parent: this,
      freeMargin: 17765 //config.freeMargin,
    });

    var defaultCon = Config.getRapidDefaultInv();
    var max = this.countP.getMax2();
    var min = this.countP.getMin2();
    var per = (defaultCon - min) / (max - min);



    this.countP._progress(per);

    // progress.option.dMaxMoney = this.countP.getMax2();
    progress.option.defaultMon = defaultCon; // this.countP.investNum;
    progress.init();

    // this.getProgress(0.0005);
  }

  setVal(p) {
    progress.option.stopDraw = false;
    progress.reDraw(p);
  }

  getProgress(val) {
    this.countP._progress(val);

    progress.option.dMaxMoney = this.countP.getMax2();
    progress.reDraw(parseInt($('#money').val(), 5));
  }

  investNum() {
    return this.countP.investNum;
  }

  getParams2(a, b, c) {
    return this.countP.getParams2(a, b, c);
  }

}

function lowestInvestAmount() {
  return 5;
}

$.store = function() {
  function b(a) {
    var c = "",
      d = "{";
    for (c in a)
      d += "object" == typeof a[c] ? '"' + c + '":' + b(a[c]) + "," : '"' + c + '":"' + a[c] + '",';
    return d = d.substring(0, d.length - 1),
      d += "}"
  }

  function c(b) {
    return JSON.parse(b)
  }

  function d() {
    this.setStore = function(c, d) {
        return c = c.trim(),
          sessionStorage ? c ? (this.removeStore(c),
            "object" == typeof d && (d = b(d)),
            sessionStorage.setItem(c, d || null),
            null) : null : void 0
      },
      this.getStore = function(b) {
        return b = b.trim(),
          sessionStorage ? b ? null == sessionStorage.getItem(b) || "null" == sessionStorage.getItem(b) ? null : c(sessionStorage.getItem(b)) : null : void 0
      },
      this.removeStore = function(b) {
        return b = b.trim(),
          sessionStorage ? b.length > 0 && sessionStorage.getItem(b) ? (sessionStorage.removeItem(b),
            null) : null : void 0
      }
  }
  return new d
};
var valEl = $('#money');
var u = $.store(),
  canvas = null;
var R = null;
var S = null;
var T = null,
  U = null,
  V = 0.1,
  W = null,
  X = null,
  Y = null,
  P = false,
  F = $("#tipsMsg"),
  E = $("#showTips"),
  Z = null,
  aa = null,
  _;
window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
    ba = setTimeout(function() {
      callback()
    }, 15)
  },
  window.cancelAnimationFrame = window.cancelRequestAnimationFrame || window.mozCancelRequestAnimationFrame || window.webkitCancelRequestAnimationFrame || window.msCancelRequestAnimationFrame || window.cancelAnimationFrame || window.webkitCancelAnimationFrame || function(a) {
    clearTimeout(ba)
  };

var progress = {
  option: {
    ruleCellWidth: $(window).width() / 320 * 22,
    ruleCellHeightl: $(window).width() / 320 * 12,
    ruleCellHeighth: $(window).width() / 320 * 24,
    ruleLength: $(window).width() / 320 * 100,
    ruleCellVal: 5,
    ruleStartX: 5,
    argsStartX: 0,
    ruleNowVal: 0,
    ruleSrartNum: 5,
    canvasWidth: 0,
    canvasHeight: 0,
    pointStartX: 0,
    pointEndX: 0,
    stopDraw: !1,
    totalMoney: 0,
    dMaxMoney: 2000,
    defaultMon: 5
  },
  
  init: function(a) {

    // a.productList[0].lowestInvestAmount;
    // D.html(a.productList[0].productName);
    // var b = a.productList[0].gradeTerm;
    // G.html(0 == b ? "每天" : b + "天"),
    canvas = document.getElementById("ruleCot");
    R = canvas.getContext("2d");
    // console.log(canvas)
    canvas.width = 2 * canvas.offsetWidth;
    canvas.height = 2 * canvas.offsetHeight;
    progress.option.canvasWidth = 2 * canvas.offsetWidth;
    progress.option.canvasHeight = 2 * canvas.offsetHeight;
    canvas.style.width = "";
    canvas.style.height = "";
    progress.option.argsStartX = progress.returnX(progress.option.defaultMon);
    progress.option.ruleStartX = progress.option.argsStartX;
    progress.draw();
    canvas.addEventListener("touchstart", progress.preDraw, false);;
    canvas.addEventListener("touchmove", progress.move, false);
    canvas.addEventListener("touchend", progress.correct, false);
  },
  returnX: function(a) {
    return progress.option.canvasWidth / progress.option.ruleCellWidth / 2 - a / progress.option.ruleCellVal
  },
  reDraw: function(a) {
    progress.option.ruleStartX = progress.returnX(a),
      progress.draw()
  },
  aniDraw: function(a, b) {
    var c = 6;
    aa = function() {
        if (a > .1) {
          if (b ? progress.option.ruleStartX = progress.option.ruleStartX + c : progress.option.ruleStartX = progress.option.ruleStartX - c,
            progress.option.totalMoney < lowestInvestAmount())
            return progress.option.ruleStartX = progress.returnX(lowestInvestAmount()),

              progress.option.stopDraw = !1,
              E.show(),
              void progress.draw();
          if (progress.option.totalMoney > u.getStore("buyData").productAmount,
            progress.option.totalMoney > progress.option.dMaxMoney)
            return progress.option.ruleStartX = progress.returnX(progress.option.dMaxMoney),

              progress.option.stopDraw = !1,
              E.show(),
              void progress.draw();
          if (progress.option.ruleStartX > progress.option.canvasWidth / progress.option.ruleCellWidth / 2)
            return void(progress.option.stopDraw = !0);
          a = .95 * a,
            progress.draw(),
            c = .95 * c,
            requestAnimationFrame(aa)
        } else
          progress.option.stopDraw = !0
      },
      window.requestAnimationFrame(aa)
  },
  autoDraw: function() {
    progress.option.ruleStartX >= progress.option.argsStartX ? progress.draw() : (progress.draw(),
        progress.autoDraw()),
      progress.option.ruleStartX = progress.option.ruleStartX + V
  },
  drawText: function(a, b, c) {
    var fontSize = $(window).width() / 320 * 18;

    0 == 0 && 1 > c && (c = 1),
      R.save(),
      R.fillStyle = "#fff"; //"#ffffff" /*"rgb(221, 221, 221)"*/ ,
    R.strokeStyle = "#fff"; //"#ffffff" /*"rgb(221, 221, 221)"*/ ,
    R.font = `lighter ${fontSize}px HelveticaNeue-Bold`,
      R.textBaseline = "top",
      R.textAlign = "center",
      R.fillText(c, a, b),

      R.restore()
  },
  draw: function() {
    var winWidth = $(window).width();

    if (!progress.option.stopDraw) {
      R.clearRect(0, 0, progress.option.canvasWidth, progress.option.canvasHeight),
        R.strokeStyle = "#fff", //"#383547" /*"rgb(221,221,221)"*/ ,
        R.fillStyle = getRuleCotBackground() || "#160e23",
        R.fillRect(0, 0, progress.option.canvasWidth, progress.option.canvasHeight);

      var len = progress.option.canvasWidth / progress.option.ruleCellWidth;
      for (var a = progress.option.ruleStartX, b = 0; a < len; a++) {

        if (!(0 > a)) {
          if (S = progress.option.ruleCellWidth * a,
            T = progress.option.canvasHeight / 2,
            U = parseInt(a - progress.option.ruleStartX) * progress.option.ruleCellVal,
            parseInt(a - progress.option.ruleStartX) % 10) {
            // if (S > winWidth && U > progress.option.dMaxMoney) {
            //   continue;
            // }
            // R.lineTo(S, T),
            if (U <= 10000) {
              R.moveTo(S, T - progress.option.ruleCellHeightl);
              R.lineTo(S, T);
              // console.log(U)
            }
          } else {
            // if (S > winWidth && U > progress.option.dMaxMoney) {
            //   continue;
            // }


            var point = T;
            if (U <= 10000) {
              R.moveTo(S, point - progress.option.ruleCellHeighth),

                R.lineTo(S, point);
              progress.drawText(S, point + progress.option.canvasHeight * .70 - 2.2 * progress.option.ruleCellHeighth, U)
            }

            // R.lineTo(S, T),



          }
          if (b++,
            b >= progress.option.canvasWidth / progress.option.ruleCellWidth) {
            break;
          }
        }
      }
      if (R.stroke(),
        R.save(),
        R.beginPath(),
        R.strokeStyle = getRuleCotColor() || '#967bdb', // "rgb(255,128,26)",
        // R.translate(.5, 0),
        R.lineWidth = winWidth / 640 * 4,
        R.moveTo(progress.option.canvasWidth / 2, 0),
        R.lineTo(progress.option.canvasWidth / 2, progress.option.canvasHeight / 2),
        R.stroke(),
        R.closePath(),
        R.restore(),
        P) {
        var c = valEl.val() || 0;
        progress.option.totalMoney = c,
          u.setStore("allMoney", {
            money: c
          }),
          e(c)
      } else {
        var c = -Math.round(progress.option.ruleStartX - Math.round(progress.option.canvasWidth / progress.option.ruleCellWidth / 2)) * progress.option.ruleCellVal;
        progress.option.totalMoney = c,
          valEl.val(0 == c ? 1 : c),
          // e(c),
          // f(),
          u.setStore("allMoney", {
            money: c
          });

        // $('.J_ProfitNum').text(c);


        var event = new CustomEvent('change:investnum', {
          detail: c
        });

        document.dispatchEvent(event);
      }
      S = null,
        T = null,
        U = null,
        a = null
    }

  },
  move: function(a) {
    if (a.preventDefault(),
      window.cancelAnimationFrame(aa),
      progress.option.totalMoney < lowestInvestAmount() && (progress.option.ruleStartX = progress.returnX(lowestInvestAmount()),

        progress.option.stopDraw = !1,
        E.show()),
      progress.option.totalMoney > progress.option.dMaxMoney)
      progress.option.ruleStartX = progress.returnX(progress.option.dMaxMoney),

      progress.option.stopDraw = !1,
      E.show();
    else {
      progress.option.ruleStartX = (Math.round(1e3 * progress.option.ruleStartX) + (Math.round(100 * a.touches[0].clientX) - Math.round(100 * progress.option.pointStartX))) / 1e3,
        progress.option.pointStartX = Math.round(100 * a.touches[0].clientX) / 100;
      var b = new Date;
      X = b.getTime(),
        Z = a.changedTouches[0].clientX,
        _ = Math.abs((Z - Y) / (X - W) * 10),
        _ > 4 ? progress.option.ruleStartX > progress.option.canvasWidth / progress.option.ruleCellWidth / 2 ? (progress.option.ruleStartX = progress.option.canvasWidth / progress.option.ruleCellWidth / 2,
          progress.option.stopDraw = !0) : FALSE = !0 : (FALSE = !1,
          progress.option.ruleStartX > progress.option.canvasWidth / progress.option.ruleCellWidth / 2 ? (progress.option.ruleStartX = progress.option.canvasWidth / progress.option.ruleCellWidth / 2,
            progress.option.stopDraw = !0) : (progress.option.stopDraw = !1,
            progress.draw()))
    }
  },
  correct: function(a) {
    if (FALSE) {
      var b = Z - Y > 0;
      progress.option.stopDraw = !1,
        progress.aniDraw(Math.round(_), b)
    }
    progress.option.totalMoney < lowestInvestAmount() && (progress.option.ruleStartX = progress.returnX(lowestInvestAmount()),

        progress.option.stopDraw = !1,
        E.show(),
        progress.draw()),
      progress.option.totalMoney > progress.option.dMaxMoney && (progress.option.ruleStartX = progress.returnX(progress.option.dMaxMoney),

        progress.option.stopDraw = !1,
        E.show(),
        progress.draw())


  },
  preDraw: function(a) {
    P = !1,
      FALSE = !1,
      window.cancelAnimationFrame(aa),
      progress.option.stopDraw = !0;
    var b = new Date;
    W = b.getTime(),
      Y = a.touches[0].clientX,
      progress.option.pointStartX = Math.round(100 * a.touches[0].clientX) / 100,
      progress.option.ruleStartX = progress.returnX(valEl.val()),
      progress.draw()
  }
};
