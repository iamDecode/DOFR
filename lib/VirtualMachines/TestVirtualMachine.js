'use strict';

/**
 * @module VitualMachines
 */

var Obj = require('../helpers/Obj'),
	VirtualMachine = require("../models/VirtualMachine"),
	kue = require("kue").createQueue();

var portIncrement = 1;

//Preserve original functions
VirtualMachine.prototype._start = VirtualMachine.prototype.start;

/**
 * Mock VirtualMachine implementation for testing
 *
 * @class TestVirtualMachine
 * @extends models.VirtualMachine
 * @constructor
 */
var TestVirtualMachine = Obj.extend(VirtualMachine, {
	start: function() {
		return this._start().then(function() {
			var script = process.argv[1];
			var args = [];

			// Spawn new child process for worker
			var options = {
				env: extend({
					PORT: (process.env.PORT ? process.env.PORT : 3001) + portIncrement,
					DOFR_PROCESS_TYPE: "worker",
					DOFR_WORKER_UUID: this.uuid
				}, process.env)
			};

			var childProcess = require('child_process').fork(script, args, options);

			portIncrement++;

			return this;
		}.bind(this));
	}
});

// Helper method
function extend(target) {
	var sources = [].slice.call(arguments, 1);
	sources.forEach(function (source) {
		for (var prop in source) {
			target[prop] = source[prop];
		}
	});
	return target;
}	

module.exports = TestVirtualMachine;