var debug = require("debug")("DOFR:Master"),
    Obj = require("./Obj"),
    VirtualMachineManager = require("./VirtualMachines/VirtualMachineManager"),
    kue = require("kue").createQueue();

var Master = Obj.extend({
    init: function(){
        debug("Master created");

        var vmm = new VirtualMachineManager();
        Promise.all([vmm.createVM(), vmm.createVM()]).then(function(created) {
            debug("Created vms: " + created.length);

            kue.create("jobs/" + created[0].uuid, {
                imageUrl: "some image url"
            }).removeOnComplete(true).save();

            vmm.count().then(function(count) {
                debug(count);
            });

            vmm.getVMs().then(function(vms) {
                debug(vms);
            });
        });
    }
});

module.exports = Master;