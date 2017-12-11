var Stomp = require('../common/stomp');
var Util = require('../app/util');

var symbolStomp = null;

module.exports = {

  getPrice: function(symbols, groupName) {
    if (Util.supportWebsocket()) {
      if (!symbolStomp) {
        symbolStomp = new Stomp({
          symbols: symbols,
          groupName: groupName
        });
      }

      symbolStomp.add(symbols);

      var prices = symbolStomp.get(symbols);

      if (prices) {
        return prices;
      }
    }
  },

  updatePrice: function(params) {
    symbolStomp.updatePrice(params);
  }

}
