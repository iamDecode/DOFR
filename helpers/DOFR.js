var debug = require("debug")("DOFR:DOFR"),
	Obj = require("./Obj"),
	Worker = require("./Worker"),
	Master = require("./Master");

var DOFR = Obj.extend({
	init: function() {
		var processType = process.env.DOFR_PROCESS_TYPE;

		if (processType === "worker")
			new Worker();
		else
			new Master();
	}
});

module.exports = DOFR;