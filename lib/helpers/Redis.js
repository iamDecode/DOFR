'use strict';

/**
 * @module helpers
 */

 var Obj = require('./Obj'),
    redis = require("redis"),
    Promise = require("bluebird");
    
/**
 * Redis client
 * 
 * @class Redis
 * @constructor
 */

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

var Redis = redis.createClient({
    host: 'dofr.sonkus.0001.use1.cache.amazonaws.com'
});
module.exports = Redis;