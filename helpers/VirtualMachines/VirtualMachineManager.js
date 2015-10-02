var Obj = require('../Obj'),
	VirtualMachine = require("./ForkVM"),
	redis = require("../Redis"),
	Promise = require("bluebird");

/**
 * Global class to manage virtual machines. It should be stateless so that any VM can take over the manager duty.
 */
var VirtualMachineManager = {
	createVM: function() {
		var vm = new VirtualMachine();

		var multi = redis.multi();
		multi.rpush("dofr_vm_list", vm.uuid);
		return multi.execAsync().then(vm.start.bind(vm));
	},

	terminateVM: function(vm) {
		var multi = redis.multi();
		multi.lrem("dofr_vm_list", 0, vm.uuid);
		vm.cleanHeartbeat();
		return multi.execAsync().then();
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