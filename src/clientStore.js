const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

class Client {
    constructor(connection) {
        this.clientId = uuidv4();
        this.connection = connection;
    }
}


module.exports = class ClientStore extends EventEmitter{
    constructor() {        
        super();
        this.clients = {} //in-mem store
    }

    addClient(connection) {
        // if (!connection) throw new Error('Connection is null')
        const client = new Client(connection);
        this.clients[client.clientId] = client;
        return client.clientId;
    }

    getClient(clientId) {
        if (!this.clients[clientId]) throw new Error('Client does not exist')
        return this.clients[clientId];
    }


    deleteClient(clientId) {
        if (!this.clients[clientId]) throw new Error('Client does not exist')
        delete this.clients[clientId];
        return Object.keys(this.clients).length
    }

    getAllClientIds() {
        return Object.keys(this.clients)
    }

}