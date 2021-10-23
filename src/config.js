const ClientStore = require('./store/clientStore')
const TokenStore = require('./store/tokenStore')

const { getFormatedMessage } =  require('./utils');

const clientStore = new ClientStore();
const tokenStore = new TokenStore()

clientStore.on('startTimer', (args) => {
    try{
        const { clientId, time } = args;
        const { connection } = clientStore.getClient(clientId)
        if(connection){
            setTimeout(() => {
                connection.sendUTF(getFormatedMessage('reload', { clientId }));
                clientStore.emit('deleteClient', { clientId });
            }, time)
        }        
    }catch(e){
        console.log(e);
    }
})

clientStore.on('deleteClient', (args) => {
    try{
        const { clientId } =  args;
        clientStore.deleteClient(clientId);
    }catch(e){
        console.log(e);
    }
})

module.exports = {
    clientStore,
    tokenStore
}