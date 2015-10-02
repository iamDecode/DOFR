var debug = require("debug")("DOFR:RandomScheduler"),
    Obj = require('./../Obj'),
    VirtualMachineManager = require("./../VirtualMachines/VirtualMachineManager"),
    BaseTaskScheduler = require("./BaseTaskScheduler"),
    kue = require("kue").createQueue();

/**
 * A task scheduler that randomly selects a VM for a task.
 * @type {Function}
 */
var RandomTaskScheduler = Obj.extend(BaseTaskScheduler, {
    /**
     * Schedule a new task on one of the VMs.
     * @param task
     */
    schedule: function(taskData) {
        VirtualMachineManager.getVMs().then(function(result) {
            //select a random VM
            var index = Math.floor(Math.random() * result.length) + 0;
            var vm = result[index];

            kue.create("jobs/" + vm.uuid, taskData).removeOnComplete(true).save();
        });
    }
});

module.exports = RandomTaskScheduler;