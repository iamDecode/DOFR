var debug = require("debug")("DOFR:Master"),
    Obj = require("./Obj"),
    ForkVM = require("./VirtualMachines/ForkVM"),
    kue = require("kue");

var queue = kue.createQueue();

var Master = Obj.extend({
    init: function(){
        debug("Master created");

        var vm = new ForkVM();
        vm.start();

        queue.create("jobs/" + vm.uuid, {
            imageUrl: "some image url"
        }).removeOnComplete(true).save();
    }
});

module.exports = Master;