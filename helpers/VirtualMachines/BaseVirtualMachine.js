var debug = require("debug")("DOFR:BaseVirtualMachine"),
	Obj = require("../Obj"),
	uuid = require("node-uuid"),
	redis = require("../Redis");

/**
 * Abstract virtual machine class
 */
var BaseVirtualMachine = Obj.extend({
	uuid: null,

	init: function(argUuid) {
		this.uuid = argUuid;
		if(typeof(this.uuid) === "undefined")
			this.uuid = uuid.v4();
	},

	/**
	 * Starts a new virtual machine. Make sure to call the base class when overriding.
	 * @returns {*}
	 */
	start: function() {
		return redis.rpushAsync("dofr_vm_list", this.uuid);
	},

	/**
	 * Stops a virtual machine. Make sure to call the base class when overriding.
	 * @returns {*}
	 */
	stop: function() {
		var multi = redis.multi();
		multi.lrem("dofr_vm_list", 0, this.uuid); //remove from vm list
		multi.del(this.uuid + "_heartbeat"); //remove heartbeat
		return multi.execAsync();
	},

	/**
	 * Send a new heartbeat.
	 * @returns {*}
	 */
	sendHeartbeat: function() {
		var timeInMilliseconds = (new Date()).getTime();
		return redis.setAsync(this.uuid + "_heartbeat", timeInMilliseconds).then(function() {
			debug(this.uuid + " sent a heartbeat: " + timeInMilliseconds);
		}.bind(this));
	},
	/**
	 * Get the last sent heartbeat.
	 * @returns {*}
	 */
	lastHeartbeat: function() {
		return redis.getAsync(this.uuid + "_heartbeat");
	}
});

module.exports = BaseVirtualMachine;