'use strict';

var util = {
    type: function(obj) {
        return /\[object (\w+)\]/.exec(Object.prototype.toString.call(obj))[1].toLowerCase()
    },
    objEach: function(obj, fn) {
        if (!obj) return
        for (var key in obj) {
            if (hasOwn(obj, key)) {
                if (fn(key, obj[key]) === false) break
            }
        }
    },
    diff: function(next, pre, _t) {
        var that = this
            // defult max 4 level        
        _t = _t == undefined ? 4 : _t

        if (_t <= 0) return next !== pre

        if (this.type(next) == 'array' && this.type(pre) == 'array') {
            if (next.length !== pre.length) return true
            return next.some(function(item, index) {
                return that.diff(item, pre[index], _t - 1)
            })
        } else if (this.type(next) == 'object' && this.type(pre) == 'object') {
            var nkeys = Object.keys(next)
            var pkeys = Object.keys(pre)
            if (nkeys.length != pkeys.length) return true

            var that = this
            return nkeys.some(function(k) {
                return (!~pkeys.indexOf(k)) || that.diff(next[k], pre[k], _t - 1)
            })
        }
        return next !== pre
    },
    slice: function (a) {
        return [].slice.call(a)
    }
}

module.exports = util