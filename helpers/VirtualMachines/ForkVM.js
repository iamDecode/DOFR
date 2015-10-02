var Obj = require('../Obj'),
	VirtualMachine = require("./VirtualMachine"),
	uuid = require("node-uuid");

/**
 * Mock VirtualMachine implementation for testing
 */
var ForkVM = Obj.extend(VirtualMachine, {
	start: function() {
		if(this.uuid !== null)
			throw "VM is already started";

		this.uuid = uuid.v4();

	    var script = process.argv[1];
	    var args = [];

		function extend(target) {
			var sources = [].slice.call(arguments, 1);
			sources.forEach(function (source) {
				for (var prop in source) {
					target[prop] = source[prop];
				}
			});
			return target;
		}

		var options = {
			env: extend({
				PORT: process.env.PORT ? process.env.PORT + 1 : 3001,
				DOFR_PROCESS_TYPE: "worker",
				DOFR_WORKER_UUID: this.uuid
			}, process.env),
			execArgv: ["--debug-brk=" + (process.debugPort + 1).toString()]
		}
	    var childProcess = require('child_process').fork(script, args, options);
	}
});

module.exports = ForkVM;