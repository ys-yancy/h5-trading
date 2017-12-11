function Uri(url) {
    this.url = url || location.href;
}

$.extend(Uri.prototype, {

    /*
     * http://t.invhero.com/i/xfarwer?24234
     * path: i/
     * return: xfarwer
     */

    getNextPath: function(path, count) {
        var url = this.url;
        var index = url.indexOf(path);
        if (index === -1)
            return undefined;
        var str = url.slice(index + path.length);
        return str.substr(0, count);
    },

    getParam: function(name) {
        var search = this._getSearch();
        if (!search) {
            return;
        }
        var items = search.split('&');
        for (var i = 0, len = items.length; i < len; i++) {
            var item = items[i].split('=');
            var key = item[0],
                value = item[1];

            key = decodeURIComponent(key);
            try {
                value = decodeURIComponent(value);
                value = this.escapeHTML(value);
            } catch (e) {
                value = ''
            }

            if (key === name) {
                return value;
            }
        }

        return;
    },

    getParams: function() {
        var search = this._getSearch();
        var params = {};
        if (!search) {
            return params;
        }
        var items = search.split('&');
        for (var i = 0, len = items.length; i < len; i++) {
            var item = items[i].split('=');
            var key = item[0],
                value = item[1];

            key = decodeURIComponent(key);
            try {
                value = decodeURIComponent(value);
                value = this.escapeHTML(value);
            } catch (e) {
                value = '';
            }
            params[key] = value;
        }

        return params;
    },

    _getSearch: function() {
        var url = this.url;
        var index = url.indexOf('?');
        if (index === -1) {
            return undefined;
        }
        var search = url.slice(index + 1);

        return search;
    },

    escapeHTML: function(str) {
        // replace(/&/g, '&amp;')
        return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

});

module.exports = Uri;