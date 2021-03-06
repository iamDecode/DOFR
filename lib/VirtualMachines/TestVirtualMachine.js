'use strict';

/**
 * @module VitualMachines
 */

var Obj = require('../helpers/Obj'),
	Promise = require("bluebird"),
	VirtualMachine = require("../models/VirtualMachine");

var portIncrement = 1;

//Preserve original functions
VirtualMachine.prototype._start = VirtualMachine.prototype.start;

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
					DOFR_UUID: this.uuid,
					DOFR_PROCESS_TYPE: "worker"
				}, process.env),
				execArgv: ["--debug-brk=" + (process.debugPort + portIncrement).toString()]
			};

			var childProcess = require('child_process').fork(script, args, options);

			portIncrement++;

			return this;
		}.bind(this));
	}
},{
	getUuid: function() {
		return new Promise(function(resolve, reject) {
			var uuid = process.env.DOFR_UUID;
			return resolve(uuid);
		});
	},
	getProcessType: function() {
		return new Promise(function(resolve, reject) {
			var processType = process.env.DOFR_PROCESS_TYPE;
			if(!processType)
				processType = "master";
			return resolve(processType);
		});
	}
});

module.exports = TestVirtualMachine;