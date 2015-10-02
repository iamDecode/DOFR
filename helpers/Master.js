var debug = require("debug")("DOFR:Master"),
    Obj = require("./Obj"),
    VirtualMachineManager = require("./VirtualMachines/VirtualMachineManager"),
    kue = require("kue").createQueue();

/**
 * This master class is the main entry point for when a process starts as a master.
 * @type {Function}
 */
var Master = Obj.extend({
    init: function(){
        debug("Master created");

        //Set up a timer to clean virtual machines (from for example Redis) every 10 seconds
        setInterval(this.cleanUp, 1000 * 10);

        //Set up some VMs
        Promise.all([VirtualMachineManager.createVM(), VirtualMachineManager.createVM()]).then(function(created) {
            debug("Created vms: " + created.length);

            kue.create("jobs/" + created[0].uuid, {
                imageUrl: "some image url"
            }).removeOnComplete(true).save();

            VirtualMachineManager.count().then(function(count) {
                debug(count);
            });

            VirtualMachineManager.getVMs().then(function(vms) {
                debug(vms);
            });
        });
    },

    /**
     * Clean Redis virtual machine references.
     */
    cleanUp: function() {
        VirtualMachineManager.getVMs().then(function(results) {
            results.forEach(function(vm) {
                var currentTime = (new Date()).getTime();

                function remove(vm) {
                    VirtualMachineManager.terminateVM(vm).then(function() {
                        debug("Cleaned up: " + vm.uuid);
                    });
                }

                vm.lastHeartbeat().then(function(heartbeatTime) {
                    //If vm has not sent a heartbeat in the last ten seconds, consider it dead
                    if (currentTime - heartbeatTime > 1000 * 10)
                        remove(vm);
                });
            });
        });

        debug("Cleaned up Redis");
    }
});

module.exports = Master;