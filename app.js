'use strict';

var debug = require("debug")("DOFR:DOFR"),
    Promise = require("bluebird"),
    Obj = require("./lib/helpers/Obj"),
    Worker = require("./lib/instances/Worker"),
    Master = require("./lib/instances/Master"),
    VirtualMachineManager = require("./lib/VirtualMachines/VirtualMachineManager"),
    InstanceData = require("./lib/helpers/InstanceData");

/**
 * Main program. Becomes a worker or master based off environment.
 *
 * @class DOFR
 * @constructor
 */
var DOFR = Obj.extend({
    init: function () {
        InstanceData.dofr_initialise().then(function () {
            Promise.all([VirtualMachineManager.getUuid(), VirtualMachineManager.getProcessType()]).then(function(results) {
                var uuid = results[0];
                var processType = results[1];

                if (processType === "worker") {
                    new Worker(uuid);
                }
                else
                    new Master();
            });
        });
    }
});

new DOFR();