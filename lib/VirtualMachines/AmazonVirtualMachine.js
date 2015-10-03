'use strict';

/**
 * @module VitualMachines
 */

var Obj = require('../helpers/Obj'),
	VirtualMachine = require("../models/VirtualMachine"),
	kue = require("kue").createQueue();

/**
 * Mock VirtualMachine implementation for testing
 *
 * @class AmazonVirtualMachine
 * @extends models.VirtualMachine
 * @constructor
 */
var AmazonVirtualMachine = Obj.extend(VirtualMachine, {
	start: function() {
		throw "Not implemented";
	}
});

module.exports = AmazonVirtualMachine;