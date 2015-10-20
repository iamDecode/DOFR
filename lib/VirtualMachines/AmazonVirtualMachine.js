'use strict';

/**
 * @module VitualMachines
 */

var debug = require("debug")("DOFR:AmazonVirtualMachine"),
	Obj = require('../helpers/Obj'),
	VirtualMachine = require("../models/VirtualMachine"),
	EC2 = require("../helpers/EC2"),
	InstanceData = require("ec2-instance-data");

InstanceData.init(function () {
	console.log("instance.latest = %s", JSON.stringify(InstanceData.latest, null, "  "));
});

//Preserve original functions
VirtualMachine.prototype._start = VirtualMachine.prototype.start;
VirtualMachine.prototype._stop = VirtualMachine.prototype.stop;

/**
 * Mock VirtualMachine implementation for testing
 *
 * @class AmazonVirtualMachine
 * @extends models.VirtualMachine
 * @constructor
 */
var AmazonVirtualMachine = Obj.extend(VirtualMachine, {
	start: function() {
		return this._start().then(function() {
			var params = {
				ImageId: 'ami-a9a8e1cc', // Amazon Linux AMI x86_64 EBS
				InstanceType: 't2.micro',
				MinCount: 1,
				MaxCount: 1,
				InstanceInitiatedShutdownBehavior: "terminate"
			};

			// Create the instance
			return EC2.runInstancesAsync(params).catch(function(err) {
				debug("Could not create instance: " + err);
			}).then(function(data) {
				var instanceId = data.Instances[0].InstanceId;
				debug("Created instance " + instanceId);
				return instanceId;
			}.bind(this)).then(function(instanceId) {
				// Add tags to the instance
				params = {
					Resources: [instanceId],
					Tags: [{
						Key: 'uuid',
						Value: this.uuid
					},
					{
						Key: "DOFR_PROCESS_TYPE",
						Value: "worker"
					}
					]};

				return EC2.createTagsAsync(params).then(function() {
					return instanceId;
				});
			}.bind(this));
		}.bind(this));
	},

	stop: function() {
		return this._stop().then(function() {
			//Find instance ids with this uuid
			var params = {
				Filters: [
					{
						Name: 'tag:uuid',
						Values: [this.uuid]
					}
				]
			};
			return EC2.describeInstancesAsync(params).then(function(data) {
				var instanceId = data.Reservations[0].Instances[0].InstanceId;
				return instanceId;
			}).then(function(instanceId) {
				params = {
					InstanceIds: [instanceId]
				};
				return EC2.terminateInstancesAsync(params);
			});
		}.bind(this));
	}
}, {
	getProcessType: function() {
		var params = {
			Filters: [
				{
					Name: "resource-id",
					Values: [InstanceData["latest"]["meta-data"]["instance-id"]]
				}
			]
		};
		return EC2.describeTagsAsync(params).then(function(data) {
			var processType = "";
			data.Tags.forEach(function(tag) {
				if(tag.key == "DOFR_PROCESS_TYPE")
					processType = tag.value;
			});
			if(!processType)
				processType = "master";
			return processType;
		});
	}
});

module.exports = AmazonVirtualMachine;