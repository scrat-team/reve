'use strict';

var util = require('./lib/util')
var conf = require('./lib/conf')
var $ = require('./lib/dm')
var is = require('./lib/is')
var _execute = require('./lib/execute')
var buildInDirectives = require('./lib/build-in')
var _components = {}
var _did = 0

function _isExpr(c) {
    return c ? !!c.trim().match(/^\{[\s\S]*?\}$/m) : false
}
function _strip (expr) {
    return expr.trim()
            .match(/^\{([\s\S]*)\}$/m)[1]
            .replace(/^- /, '')
}

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
        return _execute(vm, expr, name)
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
    d.$update = _update

    // ([property-name], expression-value, expression) 
    bind && bind.apply(d, bindParams, expr)
    upda && upda.call(d, prev)
}

function Reve(options) {
    var vm = this
    var NS = conf.namespace

    var $directives = this.$directives = []
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

    var _ready = options.ready
    var _created = options.created
    var _destroy = options.destroy

    this.$methods = {}
    this.$data = (typeof(options.data) == 'function' ? options.data():options.data) || {}
    this.$refs = {}

    util.objEach(options.methods, function (key, m) {
        vm.$methods[key] = vm[key] = m.bind(vm)
    })

    _created && _created.call(vm)

    var componentDec = NS + 'component'
    // nested component
    util.slice(el.querySelectorAll('[' + componentDec + ']')).forEach(function (tar) {
        var cname = tar.getAttribute(componentDec)
        if (!cname) {
            return console.error(componentDec + ' missing component id.')
        }
        var Component = _components[cname]
        if (!Component) {
            return console.error(componentDec + ' not found.')
        }
        var c = new Component({
            el: tar
        })
        var refid = tar.getAttribute(NS + 'ref')
        if (refid) {
            this.$refs[refid] = c
        }
    }.bind(this))

    Object.keys(buildInDirectives).forEach(function (dname) {
        var def = buildInDirectives[dname]
        dname = NS + dname
        var bindingDrts = util.slice(el.querySelectorAll('[' + dname + ']'))
        if (el.hasAttribute(dname)) bindingDrts.unshift(el)
        bindingDrts.forEach(function (tar) {

            var drefs = tar._diretives || []
            var expr = tar.getAttribute(dname) || ''
            // prevent repetitive binding
            if (drefs && ~drefs.indexOf(dname)) return
            var sep = util.directiveSep
            var d
            if (def.multi && expr.match(sep)) {
                // multiple defines expression parse
                _strip(expr)
                    .split(sep)
                    .forEach(function(item) {
                        // discard empty expression 
                        if (!item.trim()) return
                        d = new Directive(vm, tar, def, dname, '{' + item + '}')
                    })
            } else {
                d = new Directive(vm, tar, def, dname, expr)
            }
            $directives.push(d)
            drefs.push(dname)
            tar._diretives = drefs
        })
    })

    _ready && _ready.call(vm)
}

function Ctor (options) {
    var baseMethods = options.methods
    function Class (opts) {
        var baseData = options.data ? options.data() : {}
        var instanOpts = util.extend({}, options, opts)
        typeof(instanOpts.data) == 'function' && (instanOpts.data = instanOpts.data())  
        util.extend({}, instanOpts.methods, baseMethods)
        util.extend({}, instanOpts.data, baseData)
        Reve.call(this, instanOpts)
    }
    Class.prototype = Reve.prototype
    return Class
}

Reve.create = function (options) {
    return Ctor(options)
}

Reve.component = function (id, options) {
    var c = Ctor(options)
    _components[id] = c
    return c
}

module.exports = Reve
