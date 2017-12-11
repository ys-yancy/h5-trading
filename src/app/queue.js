'use strict';

var cache = {};

module.exports = {
  has(symbolStr) {


    return !!cache[symbolStr];
  },

  add(symbolStr, promise, returnObj) {
    if (!cache[symbolStr]) {
      cache[symbolStr] = [];
    }

    promise && cache[symbolStr].push({
      promise: promise,
      returnObj: returnObj
    });

  },

  resolve(symbolStr, data) {
    var queue = cache[symbolStr];

    if (!queue || queue.length === 0) {
      return;
    }

    

    setTimeout(() => {
      queue.forEach((item) => {
        console.log(symbolStr, item, data)
        if (item.returnObj) {
          item.promise.resolve(data.data);
        } else {
          item.promise.resolve(data.price);
        }
      });

      cache[symbolStr] = null;
    }, 0);
  }
};
