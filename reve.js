'use strict';

var util = require('./util')
var conf = require('./conf')
var buildInDirectives = require('./build-in')
var $ = require('dm')

function _isExpr(c) {
    return c ? !!c.trim().match(/^\{[\s\S]*?\}$/m) : false
}
function _extract (expr) {
    if (!expr) return null
    var vars = expr.match(_varsRegexp)
    vars = !vars ? [] : vars.filter(function(i) {
        if (!i.match(/^[\."'\]\[]/) && !i.match(/\($/)) {
            return i
        }
    })
    return vars
}
function _strip (expr) {
	return expr.trim()
	        .match(/^\{([\s\S]*)\}$/m)[1]
	        .replace(/^- /, '')
}

var _did = 0
function Directive(vm, tar, def, name, expr) {
    var d = this
    var bindParams = []
    var isExpr = !!_isExpr(expr)

    isExpr && (expr = _strip(expr))

    if (def.multi) {
        // extract key and expr from "key: expression" format
        var key
        expr = expr.replace(/^[^:]+:/, function(m) {
            key = m.replace(/:$/, '').trim()
            return ''
        }).trim()

        bindParams.push(key)
    }

    d.$el = tar
    d.$vm = vm
    d.$id = _did++

    var bind = def.bind
    var unbind = def.unbind
    var upda = def.update
    var prev
    var unwatch


    // set properties
    util.objEach(def, function(k, v) {
        d[k] = v
    })

    /**
     *  execute wrap with directive name
     */
    function _exec(expr) {
        return _execute(vm, scope, expr, name)
    }

    /**
     *  update handler
     */
    function _update(kp) {
        var nexv = _exec(expr)
        if (util.diff(nexv, prev)) {
            var p = prev
            prev = nexv
            upda && upda.call(d, nexv, p, kp)
        }
    }

    /**
     *  If expression is a string iteral, use it as value
     */
    prev = isExpr ? _exec(expr) : expr
    bindParams.push(prev)
    bindParams.push(expr)
    // watch variable changes of expression
    if (def.watch !== false && isExpr) {
        unwatch = _watch(vm, _extractVars(expr), _update)
    }
    d.$update = _update

    // ([property-name], expression-value, expression) 
    bind && bind.apply(d, bindParams, expr)
    upda && upda.call(d, prev)
}

function Reve(options) {
    var vm = this
    var NS = conf.namespace

	this.$directives = []
	this.$update = function () {
		this.$directives.forEach(function (d) {
			d.$update()
		})
	}
    var el = options.el
    /**
     *  Mounted element detect
     */
    if (el && options.template) {
        el.innerHTML = options.template
    } else if (options.template) {
        el = document.createElement('div')
        el.innerHTML = options.template
    } else if (util.type(el) == 'string') {
        el = document.querySelector(el)
    } else if (!is.Element(el)) {
        throw new Error('Unmatch el option')
    }
	Object.keys(buildInDirectives).forEach(function (dname) {
        var def = buildInDirectives[dname]
        dname += NS
        util.slice(document.querySelectorAll('[' + dname + ']'))
            .forEach(function (tar) {

            var drefs = tar._diretives || []
            var expr = tar.getAttribute(dname).value || ''
            // prevent repetitive binding
            if (drefs && ~drefs.indexOf(dname)) return

            var sep = util.directiveSep
            var d
            // multiple defines expression parse
            if (def.multi && expr.match(sep)) {
                    _strip(expr)
                        .split(sep)
                        .forEach(function(item) {
                            // discard empty expression 
                            if (!item.trim()) return
                            
                            d = new Directive(vm, tar, def, dname, '{' + item + '}')
                            _directives.push(d)
                            _setBindings2Scope(scope, d)
                        })
            } else {
                $d = new Directive(vm, tar, def, dname, expr)
            }

            drefs.push(dname)
            tar._diretives = drefs
        })
    })
}

module.exports = Reve
