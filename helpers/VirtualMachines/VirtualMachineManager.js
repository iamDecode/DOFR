var Obj = require('../Obj'),
	VirtualMachine = require("./ForkVM"),
	redis = require("redis"),
	Promise = require("bluebird");

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

var client = redis.createClient();

/**
 * Class to manage virtual machines. It should be stateless so that any VM can take over the manager duty.
 */
var VirtualMachineManager = Obj.extend({
	createVM: function() {
		return new Promise(function(resolve, reject) {
			var vm = new VirtualMachine();

			var multi = client.multi();
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
		return client.llenAsync("dofr_vm_list");
	},

	getVMs: function() {
		return client.lrangeAsync("dofr_vm_list", 0, -1);
	}
});

module.exports = VirtualMachineManager;