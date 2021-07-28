const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');
const Redis = require( 'ioredis' );

const  redis = require('redis');
const jsonify = require('redis-jsonify')

class Client {
    constructor(connection) {
        this.clientId = uuidv4();
        this.connection = connection;
    }
}


module.exports = class ClientStore extends EventEmitter{
    constructor() {        
        super();
        console.log("connecting to redis....")
        // this.redis = new Redis();
        this.redisClient = jsonify(redis.createClient())
        console.log("After redis connection .... ")
    }

    async addClient(connection) {
        // if (!connection) throw new Error('Connection is null')
        const client = new Client(connection);
        // console.log(JSON.stringify(client))
        // await this.redis.hmset(client.clientId, client)
        await this.redisClient.set(client.clientId, client)
        return client.clientId;
    }

    async getClient(clientId) {
        if(!clientId) throw new Error("ClientId can not be undefined")
        const res = await this.redis.exists(clientId);
        if(!res || res === 0) throw new Error('Client does not exist')

        // const client = await this.redis.hmget(clientId)
        const client  = this.redisClient.set(clientId)
        // console.log(JSON.parse(client))
        return client;
    }


    async deleteClient(clientId) {
        if(!clientId) throw new Error("ClientId can not be undefined")
        const res = await this.redis.exists(clientId);
        if(!res || res === 0) throw new Error('Client does not exist')

        await this.redis.del(clientId);
    }




}