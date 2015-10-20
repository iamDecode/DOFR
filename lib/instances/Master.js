'use strict';

/**
 * @module instances
 */

var config = require('config'),
    debug = require("debug")("DOFR:Master"),
    express = require('express'),
    Obj = require("../helpers/Obj"),
    VMManager = require("../VirtualMachines/VirtualMachineManager"),
    Scheduler = require("../Schedulers/QueueScheduler"),
    kue = require("../helpers/Kue"),
    redisClient = require("../helpers/Redis"),
    faces = require("../faces.json"),
    Promise = require("bluebird"),
    Logging = require("../helpers/Logging");

/**
 * This master class is the main entry point for when a process starts as a master.
 *
 *  @class Master
 *  @constructor
 */
var Master = Obj.extend({
    taskScheduler: null,
    app: null,

    init: function(){
        debug("Master created");

        Logging.masterStarted();

        //Host statistics interface
        this.app = express();
        this.app.get('/', function (req, res) {
            redisClient.lrangeAsync("dofr:log", 0, -1).then(function(result){
                var output = [];
                result.forEach(function(entry){
                    output.push(JSON.parse(entry));
                });
                res.send(output);
            });            
        });

        var server = this.app.listen(3000, function () {
          var host = server.address().address;
          var port = server.address().port;

          debug('listening at http://%s:%s', host, port);
        });
        
        //Listen to Kue events and Log them
        kue.createQueue().on('job enqueue', function(id, type) {
            var split = type.split("jobs/");
            var vmUuid = split[1];
            Logging.taskScheduled(vmUuid, id);
        }).on('job complete', function(id, result){
            kue.Job.get(id, function(err, job){
                if (err)
                    return;

                var split = job.type.split("jobs/");
                var vmUuid = split[1];
                Logging.taskFinished(vmUuid, job.id, job.created_at, job.started_at);

                job.remove(function(err){
                    if (err)
                        throw err;
                });
            });
        });

        //Create task scheduler
        this.taskScheduler = new Scheduler();

        //Create some VMs
        var newVMs = [];
        for(var i = 0; i < 2; i++) {
            newVMs.push(VMManager.createVM());
        }
        Promise.all(newVMs).then(function(created) {
            debug("Created vms: " + created.length);
        });

        //Set up a timer to clean (dead) virtual machines every 10 seconds
        setInterval(this.taskScheduler.cleanUp.bind(this.taskScheduler), config.get('cleanup.interval'));
        this.taskScheduler.cleanUp.apply(this.taskScheduler);

        //For testing, generate tasks every second
        this.simulateTasks(1000);
    },

    simulateTasks: function(timeout){
        this.taskScheduler.schedule({
            //Random URL to face image
            imageUrl: faces[Math.floor(Math.random() * faces.length)]
        });

        setTimeout(function(){
            this.simulateTasks(++timeout);
        }.bind(this), timeout);
    }
});

module.exports = Master;