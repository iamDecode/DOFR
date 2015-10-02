var debug = require("debug")("DOFR:BaseTaskScheduler"),
    Obj = require('./../Obj');

/**
 * The task scheduler decides what task is sent to which VM.
 * @type {Function}
 */
var BaseTaskScheduler = Obj.extend({
    /**
     * Schedule a new task on one of the VMs.
     * @param task
     */
    schedule: function(task) {
        throw "Not implemented";
    }
});

module.exports = BaseTaskScheduler;