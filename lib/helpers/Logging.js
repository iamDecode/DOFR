'use strict';

/**
 * @module helpers
 */

var Obj = require('./Obj'),
    redis = require("./Redis");

var logKey = "dofr:log";

var Logging = Obj.extend({}, {
    log: function(sender, task, data) {
        var timeInMilliseconds = (new Date()).getTime();
        var obj = {
            time: timeInMilliseconds,
            sender: sender,
            task: task,
            data: data
        };
        redis.rpush(logKey, JSON.stringify(obj));
    },

    /**
     * Log that a VM has started.
     * @param uuid The uuid of the started VM.
     */
    vmStarted: function(uuid) {
        this.log("master", "vmStarted", {
            uuid: uuid
        });
    },
    /**
     * Log that a VM has stopped.
     * @param uuid The uuid of the stopped VM.
     */
    vmStopped: function(uuid) {
        this.log("master", "vmStopped", {
            uuid: uuid
        });
    },
    taskScheduled: function(vmUuid, taskUuid) {
        this.log("master", "taskScheduled", {
            vm: vmUuid,
            task: taskUuid
        });
    },

    taskStarted: function(vmUuid, taskUuid) {
        this.log("worker", "taskStarted", {
            vm: vmUuid,
            task: taskUuid
        });
    },
    taskFinished: function(vmUuid, taskUuid) {
        this.log("worker", "taskFinished", {
            vm: vmUuid,
            task: taskUuid
        });
    }
});
module.exports = Logging;