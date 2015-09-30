'use strict';

/**
 * @module util
 */

/**
 * A basic object that can be used to extend
 *
 * @class Obj
 * @constructor
 */
var Obj = function() {};

/**
 * Extend a class
 *
 * @method extend
 * @static
 * @param {Function} [parent=Obj] The parent class
 * @param {Object} proto The prototype methods
 * @param {Object} [staticProps={}] The static properties
 * @return {Function} The created class
 */
Obj.extend = function() {
    var parent = Object,
        proto,
        staticProps = {};
    if (arguments.length === 1) { // Only proto supplied
        proto = arguments[0];
    } else if (arguments.length === 2) {
        if (arguments[0] instanceof Function) { // Parent and proto supplied
            parent = arguments[0];
            proto = arguments[1];
        } else { // Proto and staticProps supplied
            proto = arguments[0];
            staticProps = arguments[1];
        }
    } else {
        parent = arguments[0];
        proto = arguments[1];
        staticProps = arguments[2];
    }
    var cls = function() {
        // TODO: Make sure this call is an object creator
        // Call the init function
        if ('init' in this) {
            this.init.apply(this, arguments);
        }
    };
    cls.prototype = Object.create(parent.prototype);
    cls.prototype.constructor = cls;
    
    // Add the prototype methods
    for (var func in proto) {
        cls.prototype[func] = proto[func];
    }
    
    // Add the static methods
    for (var staticFunc in staticProps) {
        cls[staticFunc] = staticProps[staticFunc];
    }
    
    return cls;
};

module.exports = Obj;