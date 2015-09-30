var Obj = require('../Obj');

/**
 * Abstract virtual machine class
 */
var VirtualMachine = Obj.extend({
	start: function(){
		throw "Not implemented";	
	},

	stop: function(){
		throw "Not implemented";
	}
});

module.exports = VirtualMachine;