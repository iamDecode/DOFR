'use strict';

/**
 * @module models
 */

var debug = require("debug")("DOFR:VirtualMachine"),
	Obj = require("../helpers/Obj"),
	uuid = require("node-uuid"),
	redis = require("../helpers/Redis"),
	Promise =  require("bluebird"),
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

		//Tasks that were scheduled to this VM will be rescheduled by the Master when its cleanUp timer fires.

		return multi.execAsync();
	},

	/**
	 * Gets the active jobs for this VirtualMachine.
	 * @param limit
	 * @returns {*}
	 */
	getActiveJobs: function() {
		return Promise.promisifyAll(kue.Job).rangeByTypeAsync("jobs/" + this.uuid, "active", 0, Number.MAX_VALUE, "asc");
	},

	/**
	 * Gets the inactive jobs for this VirtualMachine.
	 * @param limit
	 * @returns {*}
	 */
	getInactiveJobs: function() {
		debug(Promise.promisifyAll(kue.Job));
		return Promise.promisifyAll(kue.Job).rangeByTypeAsync("jobs/" + this.uuid, "inactive", 0, Number.MAX_VALUE, "asc");
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