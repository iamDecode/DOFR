'use strict';

/**
 * @module instances
 */

var cv = require("opencv"),
    kue = require("kue").createQueue(),
    Obj = require('../helpers/Obj'),
    redis = require("../helpers/Redis"),
    request = require('request'),
    VirtualMachine = require("../models/VirtualMachine");

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
        kue.process("jobs/" + this.vm.uuid, function(job, done) {
            var debuggr = this.debug;

            //Request the new image from storage
            var req = request.defaults({ encoding: null });
            req.get("https://dl.dropboxusercontent.com/u/2718539/" + job.data.imageUrl, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    //Read image
                    cv.readImage(body, function(err, im) {
                        //Factial recognition
                        im.detectObject(cv.FACE_CASCADE, {}, function(err, faces) {
                            //In case face(s) have been found, report.
                            if (typeof faces !== 'undefined') {
                                debuggr("Work done: " + JSON.stringify(faces));
                                done();
                            } else {
                                debuggr("Could not find face for image: " + job.data.imageUrl);
                                done("NO_FACE_FOUND");
                            }
                        });
                    });
                } else {
                    this.debug("Image could not be loaded: " + job.data.imageUrl);
                }
            });
        }.bind(this));
    }
});

module.exports = Worker;
