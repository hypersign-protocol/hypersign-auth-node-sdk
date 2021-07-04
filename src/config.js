const ClientStore = require('./clientStore')
const { getFormatedMessage } =  require('./utils');

const clientStore = new ClientStore();

clientStore.on('startTimer', (args) => {
    const { clientId, time } = args;
    const { connection } = clientStore.getClient(clientId)
    if(connection){
        setTimeout(() => {
            connection.sendUTF(getFormatedMessage('reload', { clientId }));
        }, time)
    }        
})

clientStore.on('deleteClient', (args) => {
    const { clientId } =  args;
    clientStore.deleteClient(clientId);
})

module.exports = {
    clientStore
}