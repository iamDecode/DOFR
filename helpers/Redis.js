var Obj = require('./Obj'),
    redis = require("redis"),
    Promise = require("bluebird");

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

var Redis = redis.createClient();
module.exports = Redis;