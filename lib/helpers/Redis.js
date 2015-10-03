'use strict';

/**
 * @module helpers
 */

 var Obj = require('./Obj'),
    redis = require("redis"),
    Promise = require("bluebird");
    
/**
 * Redis client
 * @class Redis
 */

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

var Redis = redis.createClient();
module.exports = Redis;