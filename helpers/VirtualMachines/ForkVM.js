var Obj = require('../Obj'),
	VirtualMachine = require("VirtualMachine");

/**
 * Mock VirtualMachine implementation for testing
 */
var ForkVM = Obj.extend(VirtualMachine, {
	start: function() {
	    var script = process.argv[1];
	    var args = ["worker"];
	    var childProcess = require('child_process').fork(script, args);
	}
});

module.exports = ForkVM;