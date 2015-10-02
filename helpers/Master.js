var debug = require("debug")("DOFR:Master"),
    Obj = require("./Obj"),
    ForkVM = require("./VirtualMachines/ForkVM");

var Master = Obj.extend({
    init: function(){
        debug("Master created");

        new ForkVM().start();
    }
});

module.exports = Master;