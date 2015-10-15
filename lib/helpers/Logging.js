'use strict';

/**
 * @module helpers
 */

var Obj = require('./Obj'),
    redis = require("./Redis");

var logKey = "dofr_log";

var Logging = Obj.extend({}, {
    log: function(sender, task, message) {
        var timeInMilliseconds = (new Date()).getTime();
        var logString = timeInMilliseconds + " | " + sender + " | " + task + " | " + message;
        redis.rpush(logKey, logString);
    },

    /**
     * Log that a VM has started.
     * @param uuid The uuid of the started VM.
     */
    vmStarted: function(uuid) {
        log("master", "vmStarted", uuid);
    },
    /**
     * Log that a VM has stopped.
     * @param uuid The uuid of the stopped VM.
     */
    vmStopped: function(uuid) {
        log("master", "vmStopped", uuid);
    },
    taskScheduled: function(vmUuid, taskUuid) {
        log("master", "taskScheduled", vmUuid + " | " + taskUuid);
    },

    taskStarted: function(vmUuid, taskUuid) {
        log("worker", "taskStarted", vmUuid + " | " + taskUuid);
    },
    taskFinished: function(vmUuid, taskUuid) {
        log("worker", "taskFinished", vmUuid + " | " + taskUuid);
    }
});
module.exports = Logging;