'use strict';

/**
 * @module VitualMachines
 */

var Obj = require('../helpers/Obj'),
	VirtualMachine = require("./AmazonVirtualMachine"),
	redis = require("../helpers/Redis"),
	Promise = require("bluebird"),
	Logging = require("../helpers/Logging");

/**
 * Global class to manage virtual machines. It should be stateless so that any VM can take over the manager duty.
 *
 * @class VirtualMachineManager
 * @static
 */
var VirtualMachineManager = Obj.extend({}, {
	createVM: function() {
		var vm = new VirtualMachine();
		return vm.start().then(function() {
			Logging.vmStarted(vm.uuid);
			return vm;
		});
	},

	terminateVM: function(vm) {
		return vm.stop().then(function() {
			Logging.vmStopped(vm.uuid);
			return vm;
		});
	},

	/**
	 * Count the number of active VMs.
	 */
	count: function() {
		return redis.llenAsync("dofr:vm_list");
	},

	getVMs: function() {
		return redis.lrangeAsync("dofr:vm_list", 0, -1).then(function(listOfUuids) {
			return listOfUuids.map(function(uuid) {
				return new VirtualMachine(uuid);
			});
		});
	},

	/**
	 * Get the process type of the calling VM.
	 */
	getProcessType: function() {
		return VirtualMachine.getProcessType();
	}
});

module.exports = VirtualMachineManager;