'use strict';

/**
 * @module models
 */

var debug = require("debug")("DOFR:Scheduler"),
    config = require("config"),
    Obj = require('../helpers/Obj'),
    kue = require("../helpers/Kue");

/**
 * Abstract scheduler class.
 * The task scheduler decides what task is sent to which VM.
 * 
 * @class Scheduler
 * @constructor
 */
var Scheduler = Obj.extend({
    toBeScheduled: [],

    /**
     * Schedule a new task on one of the VMs.
     * @param task
     */
    schedule: function(task) {
        throw "Not implemented";
    },

    createTask: function(vm, taskData) {
        return new Promise(function(resolve, reject){
            kue.createQueue().create("jobs/" + vm.uuid, taskData)
                .removeOnComplete(true)
                .save(function(err){
                    if(err) reject();
                    resolve();
                });
        });
    },

    scheduleLater: function(taskData) {
        this.toBeScheduled.push(taskData);
    }
});

module.exports = Scheduler;