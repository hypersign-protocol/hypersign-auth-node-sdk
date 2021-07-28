const ClientStore = require('./clientStore')
const ClientStoreRedis =  require('./clientStoreRedis');
const { getFormatedMessage } =  require('./utils');

const clientStore = new ClientStoreRedis();

clientStore.on('startTimer', async (args) => {
    const { clientId, time } = args;
    console.log("HSAuth: startTimer " + clientId)
    console.log("HSAuth: startTimer " + time)
    const { connection } = await clientStore.getClient(clientId)
    if(connection){
        setTimeout(() => {
            connection.sendUTF(getFormatedMessage('reload', { clientId }));
        }, time)
    }        
})

clientStore.on('deleteClient', (args) => {
    const { clientId } =  args;
    console.log("HSAuth: deleteClient " + clientId)
    clientStore.deleteClient(clientId);
})

module.exports = {
    clientStore
}