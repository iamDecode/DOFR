var debug = require("debug")("DOFR:Worker"),
    Obj = require('./Obj'),
    kue = require("kue").createQueue();

/**
 * A worker needs the following environment variables to function properly:
 * DOFR_WORKER_UUID : Used for job management
 * @type {Function}
 */
var Worker = Obj.extend({
    uuid: null,

    init: function() {
        this.uuid = process.env.DOFR_WORKER_UUID;

        kue.process("jobs/" + this.uuid, function(job, done){
            debug("Worker doing work: " + this.uuid);
            debug("Worker done: " + job.data.imageUrl);
            done();
        }.bind(this));

        debug("Worker created");
    }
});

module.exports = Worker;