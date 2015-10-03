'use strict';

/**
 * @module instances
 */

var Obj = require('../helpers/Obj'),
    redis = require("../helpers/Redis"),
    VirtualMachine = require("../models/VirtualMachine"),
    kue = require("kue").createQueue(),
    cv = require("opencv");

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
    debug: null,

    init: function() {
        this.vm = new VirtualMachine(process.env.DOFR_WORKER_UUID);
        this.debug = require("debug")("DOFR:Worker:" + this.vm.uuid);

        //Report that we are alive
        this.debug("Created.");

        //Set up a heartbeat. Every second we'll update a timestamp so the master knows we're still alive.
        setInterval(this.vm.sendHeartbeat.bind(this.vm), 1000);

        //Immediately start processing tasks
        this.work();
    },

    work: function() {
        //Process jobs assigned to this VM.
        kue.process("jobs/" + this.vm.uuid, function(job, done){

            cv.readImage("https://dl.dropboxusercontent.com/u/2718539/" + job.data.imageUrl, function(err, im){
              im.detectObject(cv.FACE_CASCADE, {}, function(err, faces){
                this.debug("Work done: " + JSON.stringify(faces));
                done();
              });
            });
        }.bind(this));
    }
});

module.exports = Worker;