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

	start: function() {
		throw "Not implemented";	
	},

	stop: function() {
		throw "Not implemented";
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
	},
	/**
	 * Remove the heartbeat key from redis.
	 */
	cleanHeartbeat: function() {
		redis.del(this.uuid + "_heartbeat");
	}
});

module.exports = BaseVirtualMachine;