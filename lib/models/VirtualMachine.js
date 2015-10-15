'use strict';

/**
 * @module models
 */

var config = require('config'),
	debug = require("debug")("DOFR:VirtualMachine"),
	Obj = require("../helpers/Obj"),
	uuid = require("haikunator"),
	redisClient = require("../helpers/Redis"),
	Promise =  require("bluebird"),
	kue = require("kue");

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
			this.uuid = uuid();
		} else {
			this.uuid = argUuid;
		}
	},

	/**
	 * Starts a new virtual machine. Make sure to call the base class when overriding.
	 * @returns {*}
	 */
	start: function() {
		//Allow X seconds of startup time. The VM won't be cleaned in this period if no
		//heartbeat is sent.
		var timeInMilliseconds = (new Date()).getTime();
		timeInMilliseconds += config.get("vm.startUpPeriod");

		var multi = redisClient.multi();
		multi.rpush("dofr_vm_list", this.uuid);
		multi.set(this.uuid + "_heartbeat", timeInMilliseconds);
		return multi.execAsync();
	},

	/**
	 * Stops a virtual machine. Make sure to call the base class when overriding.
	 * @returns {*}
	 */
	stop: function() {
		var multi = redisClient.multi();
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
        var uuid = this.uuid;
        return new Promise(function(resolve,reject){
            kue.Job.rangeByType.call(kue.createQueue(), "jobs/" + uuid, "active", 0, 1000, "asc", function(err, jobs){
                if(err) reject(err);

                //Special case for scheduler to know uuid
                if(jobs.length === 0){
                    resolve([{type:'jobs/'+uuid, fake: true}]);
                } else {
                    resolve(jobs);
                }
            });
        });
    },

	/**
	 * Gets the inactive jobs for this VirtualMachine.
	 * @param limit
	 * @returns {*}
	 */
	getInactiveJobs: function() {
        var uuid = this.uuid;
		return new Promise(function(resolve,reject){
            kue.Job.rangeByType.call(kue.createQueue(), "jobs/" + uuid, "inactive", 0, 1000, "asc", function(err, jobs){
                if(err) reject(err);
                
                //Special case for scheduler to know uuid
                if(jobs.length === 0){
                    resolve([{type:'jobs/'+uuid, fake: true}]);
                } else {
                    resolve(jobs);
                }
            });
        });
	},

	/**
	 * Send a new heartbeat.
	 * @returns {*}
	 */
	sendHeartbeat: function() {
		var timeInMilliseconds = (new Date()).getTime();
		return redisClient.setAsync(this.uuid + "_heartbeat", timeInMilliseconds).then(function() {
			debug(this.uuid + " sent a heartbeat: " + timeInMilliseconds);
		}.bind(this));
	},
	/**
	 * Get the last sent heartbeat.
	 * @returns {*}
	 */
	lastHeartbeat: function() {
		return redisClient.getAsync(this.uuid + "_heartbeat");
	}
});

module.exports = VirtualMachine;