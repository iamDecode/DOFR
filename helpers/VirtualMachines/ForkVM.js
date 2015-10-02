var Obj = require('../Obj'),
	VirtualMachine = require("./VirtualMachine"),
	uuid = require("node-uuid"),
	kue = require("kue").createQueue();

var portIncrement = 1;

/**
 * Mock VirtualMachine implementation for testing
 */
var ForkVM = Obj.extend(VirtualMachine, {
	init: function() {
		this.uuid = uuid.v4();
	},

	start: function() {
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
				PORT: (process.env.PORT ? process.env.PORT : 3001) + portIncrement,
				DOFR_PROCESS_TYPE: "worker",
				DOFR_WORKER_UUID: this.uuid
			}, process.env),
			execArgv: ["--debug-brk=" + (process.debugPort + portIncrement).toString()]
		}
		var childProcess = require('child_process').fork(script, args, options);

		portIncrement++;

		return this;
	}
});

module.exports = ForkVM;