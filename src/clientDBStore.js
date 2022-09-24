const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');
const {sessionModel} = require('./session')

class Client {
    constructor(connection) {
        this.clientId = uuidv4();
        this.connection = connection;
    }
}


module.exports = class ClientStore extends EventEmitter{
    constructor() {        
        super();
    }

   async addClient(connection) {
    try{

        const client = new Client(connection);
        console.log(client.connection)
        const clientDetail = await sessionModel.create({
            clientId: client.clientId, // challenge
            connection: client.connection
        })
        clientDetail.save()
        return client.clientId;
    }catch(e){
        console.log(e)
        console.log('----------------------')
    }
        // if (!connection) throw new Error('Connection is null')
     
    }

    async getClient(clientId) {
        console.log('===============')
        console.log(clientId)
        const clientDetail= await sessionModel.findOne({ clientId:clientId})
        if (!clientDetail) throw new Error('Client does not exist')
        return clientDetail;
    }


   async deleteClient(clientId) {
        sessionModel.findByIdAndDelete({clientId})
    }

//    async getAllClientIds() {
//    const clientDetails= await sessionModel.find()
//         return clientDetails
//     }

}