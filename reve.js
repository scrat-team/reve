'use strict';

var util = require('./lib/util')
var conf = require('./lib/conf')
var is = require('./lib/is')
var buildInDirectives = require('./lib/build-in')
var _execute = require('./lib/execute')
var _components = {}
var _globalDirectives = {}
var _did = 0

/**
 * Constructor Function and Class.
 * @param {Object} options Instance options
 * @return {Object} Reve component instance
 */
function Reve(options) {
    var vm = this
    var _ready = options.ready
    var _created = options.created
    var _shouldUpdate = options.shouldUpdate
    var $directives = this.$directives = []
    var $components = this.$components = []

    this.$update = function () {
        // should update return false will stop UI update
        if (_shouldUpdate && _shouldUpdate.apply(vm, arguments) === false) return
        // update child components
        $components.forEach(function (c) {
            c.$update()
        })
        // update directive of the VM
        $directives.forEach(function (d) {
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
        var sel = el
        el = document.querySelector(sel)
        if (!el) return console.error('Can\'t not found element by selector "' + sel + '"')
    } else if (!is.Element(el)) {
        throw new Error('Unmatch el option')
    }

    this.$el = el
    this.$methods = {}
    this.$data = (util.type(options.data) == 'function' ? options.data():options.data) || {}
    this.$refs = {}

    util.objEach(options.methods, function (key, m) {
        vm.$methods[key] = vm[key] = m.bind(vm)
    })

    _created && _created.call(vm)

    this.$compile(el)

    _ready && _ready.call(vm)
}

/**
 * Compile all directives of the HTMLElement or HTML template in current ViewModel. 
 * It's useful when load something async then append to current ViewModel's DOM Tree.
 * @param  {Element} | {String} el The HTMLElement of HTML template need to compile
 * @return {Element} | {DocumentFragment}
 */
Reve.prototype.$compile = function (el) {
    if (util.type(el) == 'string') el = _fragmentWrap(el)

    var NS = conf.namespace
    var $directives = this.$directives
    var $components = this.$components
    var componentDec = NS + 'component'
    var componentSel = '[' + componentDec + ']'
    var vm = this

    // nested component
    var grandChilds = util.slice(el.querySelectorAll(componentSel + ' ' + componentSel))
    var childs = util.slice(el.querySelectorAll(componentSel))

    childs.forEach(function (tar) {
        // prevent cross level component parse and repeat parse
        if (tar._component || ~grandChilds.indexOf(tar)) return

        var cname = _getAttribute(tar, componentDec)
        if (!cname) {
            return console.error(componentDec + ' missing component id.')
        }
        var Component = _components[cname]
        if (!Component) {
            return console.error('Component \'' + cname + '\' not found.')
        }

        var refid = _getAttribute(tar, NS + 'ref')
        var cdata = _getAttribute(tar, NS + 'data')
        var cmethods = _getAttribute(tar, NS + 'methods')
        var data = {}
        var methods = {}

        // remove 'r-component' attribute
        _removeAttribute(tar, componentDec)

        ;['ref','data', 'methods'].forEach(function (a) {
            _removeAttribute(tar, NS + a)
        })

        if (cdata) {
            data = _execLiteral(cdata, this, NS + 'data')            
        }
        if (cmethods) {
            methods = _execLiteral(cmethods, this, NS + 'methods')
        }
        tar._component = componentDec
        
        var c = new Component({
            el: tar,
            data: data,
            methods: methods
        })
        if (refid) {
            this.$refs[refid] = c
        }
        /**
         * Hook component instance update method, sync passing data before update.
         * @type {[type]}
         */
        var _$update = c.$update
        c.$update = function () {
            cdata && util.extend(c.$data, _execLiteral(cdata, vm))
            _$update.apply(c, arguments)
        }
        $components.push(c)

    }.bind(this))

    var _diretives = util.extend({}, buildInDirectives, _globalDirectives)
    // compile directives of the VM
    Object.keys(_diretives).forEach(function (dname) {

        var def = _diretives[dname]
        dname = NS + dname

        var bindingDrts = util.slice(el.querySelectorAll('[' + dname + ']'))
        // compile directive of container 
        if (el.hasAttribute && el.hasAttribute(dname)) bindingDrts.unshift(el)

        bindingDrts.forEach(function (tar) {

            var drefs = tar._diretives || []
            var expr = _getAttribute(tar, dname) || ''
            // prevent repetitive binding
            if (drefs && ~drefs.indexOf(dname)) return

            _removeAttribute(tar, dname)

            var sep = conf.directiveSep
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

    return el
}

/**
 * Create Reve subc-lass that inherit Reve
 * @param {Object} options Reve instance options
 * @return {Function} sub-lass of Reve
 */
function Ctor (options) {
    var baseMethods = options.methods
    function Class (opts) {
        var baseData = options.data ? options.data() : {}
        var instanOpts = util.extend({}, options, opts)
        util.type(instanOpts.data) == 'function' && (instanOpts.data = instanOpts.data())  
        instanOpts.methods = util.extend({}, baseMethods, instanOpts.methods)
        instanOpts.data = util.extend({}, baseData, instanOpts.data)
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
Reve.directive = function (id, def) {
    _globalDirectives[id] = def
}

/**
 * Abstract direcitve
 * @param {Reve}    vm      Reve instance
 * @param {Element} tar     Target DOM of the direcitve
 * @param {Object}  def     Directive definition
 * @param {String}  name    Attribute name of the directive
 * @param {String}  expr    Attribute value of the directive
 */
function Directive(vm, tar, def, name, expr) {
    var d = this
    var bindParams = []
    var isExpr = !!_isExpr(expr)

    isExpr && (expr = _strip(expr))

    if (def.multi) {
        // extract key and expr from "key: expression" format
        var key
        var keyRE = /^[^:]+:/
        if (!keyRE.test(expr)) {
            return console.error('Invalid expression of "{' + expr + '}", it should be in this format: ' + name + '="{ key: expression }".')
        }
        expr = expr.replace(keyRE, function(m) {
            key = m.replace(/:$/, '').trim()
            return ''
        }).trim()

        bindParams.push(key)
    }

    d.$el = tar
    d.$vm = vm
    d.$id = _did++

    var bind = def.bind
    var upda = def.update
    var prev

    // set properties
    util.objEach(def, function(k, v) {
        d[k] = v
    })

    /**
     *  execute wrap with directive name and current VM
     */
    function _exec(expr) {
        return _execute(vm, expr, name)
    }

    /**
     *  update handler
     */
    function _update() {
        var nexv = _exec(expr)
        if (!nexv[0] && util.diff(nexv[1], prev)) {
            var p = prev
            prev = nexv[1]
            upda && upda.call(d, nexv[1], p, {})
        }
    }

    /**
     *  If expression is a string iteral, use it as value
     */
    var hasError
    if (isExpr) {
        prev =  _exec(expr)
        hasError = prev[0]
        prev = prev[1]
    } else {
        prev = expr
    }
    bindParams.push(prev)
    bindParams.push(expr)
    d.$update = _update

    // ([property-name], expression-value, expression) 
    bind && bind.apply(d, bindParams, expr)
    // error will stop update
    !hasError && upda && upda.call(d, prev)
}

function _isExpr(c) {
    return c ? !!c.trim().match(/^\{[\s\S]*?\}$/m) : false
}
function _strip (expr) {
    return expr.trim()
            .match(/^\{([\s\S]*)\}$/m)[1]
            .replace(/^- /, '')
}
function _execLiteral (expr, vm, name) {
    if (!_isExpr(expr)) return {}
    var r = _execute(vm, expr.replace(new RegExp(conf.directiveSep, 'g'), ','), name) 
    return r[0] ? {} : r[1]
}
function _getAttribute (el, an) {
    return el && el.getAttribute(an)
}
function _removeAttribute (el, an) {
    return el && el.removeAttribute(an)
}
function _fragmentWrap (html) {
    var div = document.createElement('div')
    var frag = document.createDocumentFragment();
    div.innerHTML = html
    var children = div.childNodes;
    while(children.length){
        frag.appendChild(children[0]);
    }
    return frag
}

module.exports = Reve
