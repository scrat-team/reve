/**
 *  execute expression from template with specified Scope and ViewModel
 */

var util = require('./util')
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
        arguments[1] = /^\{/.test(arguments[1]) 
                        ? '. ' + arguments[1]
                        : '. {' + arguments[1] + '}' // expr
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