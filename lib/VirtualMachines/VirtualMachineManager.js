'use strict';

/**
 * @module VitualMachines
 */

var Obj = require('../helpers/Obj'),
	VirtualMachine = require("./TestVirtualMachine"),
	redis = require("../helpers/Redis"),
	Promise = require("bluebird");

/**
 * Global class to manage virtual machines. It should be stateless so that any VM can take over the manager duty.
 */
var VirtualMachineManager = {
	createVM: function() {
		var vm = new VirtualMachine();
		return vm.start();
	},

	terminateVM: function(vm) {
		return vm.stop();
	},

	/**
	 * Count the number of active VMs.
	 */
	count: function() {
		return redis.llenAsync("dofr_vm_list");
	},

	getVMs: function() {
		return redis.lrangeAsync("dofr_vm_list", 0, -1).then(function(listOfUuids) {
			return listOfUuids.map(function(uuid) {
				return new VirtualMachine(uuid);
			});
		});
	}
};

module.exports = VirtualMachineManager;