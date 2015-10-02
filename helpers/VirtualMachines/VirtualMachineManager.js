var Obj = require('../Obj'),
	VirtualMachine = require("./ForkVM"),
	redis = require("../Redis"),
	Promise = require("bluebird");

/**
 * Class to manage virtual machines. It should be stateless so that any VM can take over the manager duty.
 */
var VirtualMachineManager = {
	createVM: function() {
		return new Promise(function(resolve, reject) {
			var vm = new VirtualMachine();

			var multi = redis.multi();
			multi.rpush("dofr_vm_list", vm.uuid);
			multi.exec(function(err, res) {
				if(err)
					return reject();

				return resolve(vm.start());
			});
		});
	},

	terminateVM: function(vm) {
		throw "Not implemented";
	},

	/**
	 * Count the number of active VMs.
	 */
	count: function() {
		return redis.llenAsync("dofr_vm_list");
	},

	getVMs: function() {
		return redis.lrangeAsync("dofr_vm_list", 0, -1);
	}
};

module.exports = VirtualMachineManager;