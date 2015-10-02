var debug = require("debug")("DOFR:Worker"),
    Obj = require('./Obj');

var Worker = Obj.extend({
    init: function(){
        debug("Worker created");
    }
});

module.exports = Worker;