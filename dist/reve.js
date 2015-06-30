/**
* Reve v1.0.1
* (c) 2015 guankaishe
* Released under the MIT License.
*/
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define(factory);
	else if(typeof exports === 'object')
		exports["Reve"] = factory();
	else
		root["Reve"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var util = __webpack_require__(1)
	var conf = __webpack_require__(2)
	var is = __webpack_require__(3)
	var buildInDirectives = __webpack_require__(4)
	var _execute = __webpack_require__(6)
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
	            data = _execLiteral(cdata, this)            
	        }
	        if (cmethods) {
	            methods = _execLiteral(cmethods, this)
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
	function _execLiteral (expr, vm) {
	    if (!_isExpr(expr)) return {}
	    var r = _execute(vm, expr.replace(new RegExp(conf.directiveSep, 'g'), ',')) 
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


/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';

	function hasOwn (obj, prop) {
	    return obj && obj.hasOwnProperty(prop)
	}

	var util = {
	    type: function(obj) {
	        return /\[object (\w+)\]/.exec(Object.prototype.toString.call(obj))[1].toLowerCase()
	    },
	    extend: function(obj) {
	        if (this.type(obj) != 'object') return obj;
	        var source, prop;
	        for (var i = 1, length = arguments.length; i < length; i++) {
	            source = arguments[i];
	            for (prop in source) {
	                obj[prop] = source[prop];
	            }
	        }
	        return obj;
	    },
	    objEach: function (obj, fn) {
	        if (!obj) return
	        for(var key in obj) {
	            if (hasOwn(obj, key)) {
	                if(fn(key, obj[key]) === false) break
	            }
	        }
	    },
	    immutable: function (obj) {
	        var that = this
	        var _t = this.type(obj)
	        var n

	        if (_t == 'array') {
	            n = obj.map(function (item) {
	                return that.immutable(item)
	            })
	        } else if (_t == 'object') {
	            n = {}
	            this.objEach(obj, function (k, v) {
	                n[k] = that.immutable(v)
	            })
	        } else {
	            n = obj
	        }
	        return n
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

/***/ },
/* 2 */
/***/ function(module, exports) {

	var conf = {
		namespace: 'r-',
		directiveSep: ';'
	}

	module.exports = conf

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';

	module.exports = {
	    Element: function(el) {
	        return el instanceof HTMLElement || el instanceof DocumentFragment
	    },
	    DOM: function (el) {
	        return this.Element(el) || el instanceof Comment
	    }
	}

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 *  Global Build-in Directives
	 */

	'use strict';

	var $ = __webpack_require__(5)
	var conf = __webpack_require__(2)
	var util = __webpack_require__(1)

	module.exports = {
	    'attr': {
	        multi: true,
	        bind: function(attname) {
	            this.attname = attname
	            this._$el = $(this.$el)
	        },
	        update: function(next) {
	            if (!next && next !== '') {
	                this._$el.removeAttr(this.attname)
	            } else {
	                this._$el.attr(this.attname, next)
	            }
	        }
	    },
	    'class': {
	        multi: true,
	        bind: function(className) {
	            this.className = className
	            this._$el = $(this.$el)
	        },
	        update: function(next) {
	            if (next) this._$el.addClass(this.className)
	            else this._$el.removeClass(this.className)
	        }
	    },
	    'html': {
	        update: function(nextHTML) {
	            this.$el.innerHTML = nextHTML
	        }
	    },
	    'on': {
	        multi: true,
	        bind: function(evtType, handler, expression) {
	            this._expr = expression
	            this.type = evtType
	        },
	        update: function(handler) {
	            this.unbind()

	            var fn = handler
	            if (util.type(fn) !== 'function')
	                return console.warn('"' + conf.namespace + 'on" only accept function. {' + this._expr + '}')

	            this.fn = fn.bind(this.$vm)
	            $(this.$el).on(this.type, this.fn, false)

	        },
	        unbind: function() {
	            if (this.fn) {
	                $(this.$el).off(this.type, this.fn)
	                this.fn = null
	            }
	        }
	    },
	    'show': {
	        update: function(next) {
	            this.$el.style.display = next ? '' : 'none'
	        }
	    },
	    'style': {
	        multi: true,
	        bind: function(sheet) {
	            this.sheet = sheet
	        },
	        update: function(next) {
	            this.$el.style && (this.$el.style[this.sheet] = next)
	        }
	    }
	}


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 *  DOM manipulations
	 */

	'use strict';
	var util = __webpack_require__(1)
	var is = __webpack_require__(3)

	function Selector(sel) {
	    if (util.type(sel) == 'string') {
	        return Shell(util.copyArray(document.querySelectorAll(sel)))
	    }
	    else if (util.type(sel) == 'array') {
	        return Shell(sel)
	    }
	    else if (sel instanceof Shell) return sel
	    else if (is.DOM(sel)) {
	        return Shell(new ElementArray(sel))
	    }
	    else {
	        throw new Error('Unexpect selector !')
	    }
	}

	function Shell(nodes) {
	    if (nodes instanceof Shell) return nodes
	    var $items = new ElementArray()
	    nodes.forEach(function (item) {
	        $items.push(item)
	    })
	    return $items
	}

	function ElementArray () {
	    this.push = function () {
	        Array.prototype.push.apply(this, arguments)
	    }
	    this.forEach = function () {
	        Array.prototype.forEach.apply(this, arguments)
	    }
	    this.push.apply(this, arguments)
	}

	ElementArray.prototype = Object.create(Shell.prototype)

	var proto = Shell.prototype
	proto.find = function(sel) {
	    var subs = []
	    this.forEach(function(n) {
	        subs = subs.concat(util.copyArray(n.querySelectorAll(sel)))
	    })
	    return Shell(subs)
	}
	proto.attr = function(attname, attvalue) {
	    var len = arguments.length
	    var el = this[0]

	    if (len > 1) {
	        el.setAttribute(attname, attvalue)
	    } else if (len == 1) {
	        return (el.getAttribute(attname) || '').toString()
	    }
	    return this
	}
	proto.removeAttr = function(attname) {
	    this.forEach(function(el) {
	        el.removeAttribute(attname)
	    })
	    return this
	}
	proto.addClass = function(clazz) {
	    this.forEach(function(el) {

	        // IE9 below not support classList
	        // el.classList.add(clazz)

	        var classList = el.className.split(' ')
	        if (!~classList.indexOf(clazz)) classList.push(clazz)
	        el.className = classList.join(' ')
	    })
	    return this
	}
	proto.removeClass = function(clazz) {
	    this.forEach(function(el) {
	        
	        // IE9 below not support classList
	        // el.classList.remove(clazz)

	        var classList = el.className.split(' ')
	        var index = classList.indexOf(clazz)
	        if (~index) classList.splice(index, 1)
	        el.className = classList.join(' ')
	    })
	    return this
	}
	proto.hasClass = function(clazz) {
	    if (!this[0]) return false
	    var classList = el.className.split(' ')
	    return ~~classList.indexOf(clazz)
	}
	proto.each = function(fn) {
	    this.forEach(fn)
	    return this
	}
	proto.on = function(type, listener, capture) {
	    this.forEach(function(el) {
	        el.addEventListener(type, listener, capture)
	    })
	    return this
	}
	proto.off = function(type, listener) {
	    this.forEach(function(el) {
	        el.removeEventListener(type, listener)
	    })
	    return this
	}
	proto.html = function(html) {
	    var len = arguments.length
	    if (len >= 1) {
	        this.forEach(function(el) {
	            el.innerHTML = html
	        })
	    } else if (this.length) {
	        return this[0].innerHTML
	    }
	    return this
	}
	proto.parent = function() {
	    if (!this.length) return null
	    return Shell([_parentNode(this[0])])
	}
	proto.remove = function() {
	    this.forEach(function(el) {
	        var parent = _parentNode(el)
	        parent && parent.removeChild(el)
	    })
	    return this
	}
	proto.insertBefore = function (pos) {
	    var tar
	    if (!this.length) return this
	    else if (this.length == 1) {
	        tar = this[0]
	    } else {
	        tar = _createDocumentFragment()
	        this.forEach(function (el) {
	            _appendChild(tar, el)
	        })
	    }
	    _parentNode(pos).insertBefore(tar, pos)
	    return this
	}
	proto.insertAfter = function (pos) {
	    var tar
	    if (!this.length) return this
	    else if (this.length == 1) {
	        tar = this[0]
	    } else {
	        tar = _createDocumentFragment()
	        this.forEach(function (el) {
	            _appendChild(tar, el)
	        })
	    }
	    _parentNode(pos).insertBefore(tar, pos.nextSibling)
	    return this
	}
	// return element by index
	proto.get = function(i) {
	    return this[i]
	}
	proto.append = function(n) {
	    if (this.length) _appendChild(this[0], n)
	    return this
	}
	proto.appendTo = function (p) {
	    if (this.length == 1) _appendChild(p, this[0])
	    else if (this.length > 1) {
	        var f = _createDocumentFragment()
	        this.forEach(function (n) {
	            _appendChild(f, n)
	        })
	        _appendChild(p, f)
	    }
	}
	proto.replace = function(n) {
	    var tar = this[0]
	    _parentNode(tar).replaceChild(n, tar)
	    return this
	}

	function _parentNode (e) {
	    return e && e.parentNode
	}

	function _createDocumentFragment () {
	    return document.createDocumentFragment()
	}

	function _appendChild (p, c) {
	    return p.appendChild(c)
	}
	module.exports = Selector


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 *  execute expression from template with specified Scope and ViewModel
	 */

	var util = __webpack_require__(1)
	/**
	 *  Calc expression value
	 */
	function _execute($vm/*, expression, [label], [target]*/) {
	    /**
	     *  $scope is passed when call instance method $compile, 
	     *  Each "scope" object maybe include "$parent, data, method" properties
	     */
	    var $scope = util.extend({}, $vm.$methods, $vm.$data)

	    try {
	        return [null, util.immutable(eval('with($scope){(%s)}'.replace('%s', arguments[1])))]
	    } catch (e) {
	        arguments[1] =  '. '+ arguments[2] + '=' + (/^\{/.test(arguments[1]) 
	                                    ? arguments[1]
	                                    : '{' + arguments[1] + '}') // expr
	        // arguments[2] // label
	        // arguments[3] // target
	        switch (e.name) {
	            case 'ReferenceError':
	                console.warn(e.message + arguments[1])
	                break
	            default:
	                console.error(
	                    (arguments[2] ? '\'' + arguments[2] + '\': ' : ''),
	                    e.message + arguments[1],
	                    arguments[3] || ''
	                )
	        }
	        return [e]
	    }
	}
	module.exports = _execute

/***/ }
/******/ ])
});
;