'use strict';

var debug = require("debug")("DOFR:DOFR"),
	Obj = require("./helpers/Obj"),
	Worker = require("./instances/Worker"),
	Master = require("./instances/Master");

/**
 * Main program. Becomes a worker or master based off environment.
 * 
 * @class DOFR
 * @constructor
 */
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