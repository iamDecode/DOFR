'use strict';

var debug = require("debug")("DOFR:DOFR"),
  Obj = require("./lib/helpers/Obj"),
  Worker = require("./lib/instances/Worker"),
  Master = require("./lib/instances/Master"),
  VirtualMachineManager = require("./lib/VirtualMachines/VirtualMachineManager");

/**
 * Main program. Becomes a worker or master based off environment.
 * 
 * @class DOFR
 * @constructor
 */
var DOFR = Obj.extend({
  init: function() {
    VirtualMachineManager.getProcessType(this).then(function(processType) {
      if (processType === "worker")
        new Worker();
      else
        new Master();
    });
  }
});

new DOFR();