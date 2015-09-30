var Obj = require('../Obj'),
	VirtualMachine = require("VirtualMachine");

/**
 * Class to manage virtual machines
 */
var VirtualMachineManager = Obj.extend({
	/**
	 * Start a new VM
	 * @return {VirtualMachine} The started VM
	 */
	startVM: function(){
		return new VirtualMachine();
	},

	/**
	 * Stop a certain VM
	 * @return {Boolean}
	 */
	stopVM: function(){
		throw "Not implemented";
	}
});

module.exports = VirtualMachineManager;