'use strict';

/**
 * @module models
 */

var debug = require("debug")("DOFR:Scheduler"),
    Obj = require('../helpers/Obj'),
    kue = require("kue");

/**
 * Abstract scheduler class.
 * The task scheduler decides what task is sent to which VM.
 * 
 * @class Scheduler
 * @constructor
 */
var Scheduler = Obj.extend({
	queue: null,

	init: function(){
		this.queue = kue.createQueue();
	},

    /**
     * Schedule a new task on one of the VMs.
     * @param task
     */
    schedule: function(task) {
        throw "Not implemented";
    }
});

module.exports = Scheduler;