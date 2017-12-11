"use strict";

/**
 * 实现YUI3 Y.extend 类似的继承功能
 */
function extend(child, parent, px, sx) {
    if (!child || !parent) {
        return child;
    }

    var parentProto = parent.prototype;
    var childProto = Object.create(parentProto);

    child.prototype = childProto;
    childProto.constructor = child;
    child.superclass = parentProto;

    if (parent != Object && parentProto.constructor == Object.prototype) {
        parentProto.constructor = parent;
    }

    if (px) {
        $.extend(childProto, px, true);

        if (px.mix && $.isArray(px.mix)) {
            $.each(px.mix, function(index, fn) {
                $.extend(childProto, fn, true);
            });
        }
    }



    if (sx) {
        $.extend(child, sx, true);
    }

    return child;

}

if (!Object.create) {
    Object.create = function(obj) {
        function F() {}

        return function(obj) {
            F.prototype = obj;
            return new F();
        }
    }
}

module.exports = extend;