'use strict';

/**
 * @module instances
 */

var debug = require("debug")("DOFR:Worker"),
    Obj = require('../helpers/Obj'),
    redis = require("../helpers/Redis"),
    VirtualMachine = require("../models/VirtualMachine"),
    kue = require("kue").createQueue();

/**
 * This worker class is the main entry point for when a process gets started as a worker.
 * A worker needs the following environment variables to function properly:
 * DOFR_WORKER_UUID : Used for job management
 * 
 * @class Worker
 * @constructor
 */
var Worker = Obj.extend({
    vm: null,

    init: function() {
        debug("Worker created");

        this.vm = new VirtualMachine(process.env.DOFR_WORKER_UUID);

        //Set up a heartbeat. Every second we'll update a timestamp so the master knows we're still alive.
        setInterval(this.vm.sendHeartbeat.bind(this.vm), 1000);

        //Process jobs assigned to this VM.
        kue.process("jobs/" + this.vm.uuid, function(job, done){
            debug("Worker doing work: " + this.vm.uuid);
            debug("Worker done: " + job.data.imageUrl);
            done();
        }.bind(this));
    }
});

module.exports = Worker;