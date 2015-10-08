'use strict';

/**
 * @module models
 */

var debug = require("debug")("DOFR:VirtualMachine"),
	Obj = require("../helpers/Obj"),
	uuid = require("node-uuid"),
	redis = require("../helpers/Redis"),
	kue = require("../helpers/Kue");

/**
 * Abstract virtual machine class
 *
 * @class VirtualMachine
 * @constructor
 */
var VirtualMachine = Obj.extend({
	uuid: null,

	init: function(argUuid) {
		if(typeof argUuid === "undefined") {
			this.uuid = uuid.v4();
		} else {
			this.uuid = argUuid;
		}
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

		//TODO: clean Kue and re-schedule tasks

		return multi.execAsync();
	},

	/**
	 * Gets the active jobs for this VirtualMachine.
	 * @param limit
	 * @returns {*}
	 */
	getActiveJobs: function(limit) {
		return kue.rangeByTypeAsync("jobs/" + this.uuid, "active", 0, limit, "asc");
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

module.exports = VirtualMachine;