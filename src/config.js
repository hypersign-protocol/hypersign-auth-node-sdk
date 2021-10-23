const ClientStore = require('./store/clientStore')
const TokenStore = require('./store/tokenStore')
const log = require("simple-node-logger")

const { getFormatedMessage } =  require('./utils');

const clientStore = new ClientStore();
const tokenStore = new TokenStore();

// LOGGING
const log_path = "hypersign-auth.log";

const logger = log.createSimpleLogger({
    logFilePath: log_path,
    timestampFormat: "YYYY-MM-DD HH:mm:ss.SSS"
});

logger.setLevel("debug");
  

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
        logger.error(e);
    }
})

clientStore.on('deleteClient', (args) => {
    try{
        const { clientId } =  args;
        clientStore.deleteClient(clientId);
    }catch(e){
        logger.error(e);
    }
})

module.exports = {
    clientStore,
    tokenStore,
    logger
}