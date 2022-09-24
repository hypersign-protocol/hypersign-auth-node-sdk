const ClientStore = require('./clientDBStore')
const { getFormatedMessage } =  require('./utils');
const mongoose = require('mongoose')
const url= '' //insert db url

mongoose.connect(url).then(console.log('connected successfully')).catch(console.error)
    

const clientStore = new ClientStore();

clientStore.on('startTimer', async (args) => {
    const { clientId, time } = args;
    const { connection } = await clientStore.getClient(clientId)
    if(connection){
        setTimeout(() => {
            connection.sendUTF(getFormatedMessage('reload', { clientId }));
        }, time)
    }        
})

clientStore.on('deleteClient',  (args) => {
    const { clientId } =  args;
    clientStore.deleteClient(clientId);
})

module.exports = {
    clientStore,
    mongoose
}