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
    }
});

module.exports = Master;