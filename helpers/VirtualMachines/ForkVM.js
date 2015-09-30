var VirtualMachine = require("VirtualMachine");

VirtualMachine.prototype.start = function() {
    var script = process.argv[1];
    var args = ["worker"];
    var childProcess = require('child_process').fork(script, args);
}

module.exports = VirtualMachine;