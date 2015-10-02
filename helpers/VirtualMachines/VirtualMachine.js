var debug = require("debug")("DOFR:VirtualMachine"),
	Obj = require("../Obj"),
	uuid = require("node-uuid"),
	redis = require("../Redis");

/**
 * Abstract virtual machine class
 */
var VirtualMachine = Obj.extend({
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

	sendHeartbeat: function() {
		var timeInMilliseconds = (new Date()).getTime();
		return redis.setAsync(this.uuid + "_heartbeat", timeInMilliseconds).then(function() {
			debug(this.uuid + " sent a heartbeat: " + timeInMilliseconds);
		}.bind(this));
	},
	lastHeartbeat: function() {
		return redis.getAsync(this.uuid + "_heartbeat");
	}
});

module.exports = VirtualMachine;