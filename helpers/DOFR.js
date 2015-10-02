var debug = require("debug")("DOFR:DOFR"),
	Obj = require('./Obj'),
	ForkVM = require("./VirtualMachines/ForkVM");

var DOFR = Obj.extend({
	init: function(){
		var processType = process.env.DOFR_PROCESS_TYPE;

		if(processType === "worker")
			debug("I am a worker!");
		else {
			debug("I am a master");

			var vm = new ForkVM();
			vm.start();
		}
	}
});

module.exports = DOFR;