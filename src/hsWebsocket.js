const WebSocket = require('websocket')
const { clientStore } = require('./config')
const { getFormatedMessage } =  require('./utils');



module.exports = class HSWebsocket {
    constructor(server, baseUrl, appDid, appName, schemaId) {
        if (!server) throw new Error('Http server is required.')
        if (!baseUrl) throw new Error('Server baseUrl is required.')
        this.server = server;
        this.baseUrl = baseUrl;
        this.appDid = appDid;
        this.appName = appName;
        this.schemaId = schemaId;
        
    }

    getQRData(baseUrl, challenge){
        baseUrl = this.checkSlash(baseUrl);
        const JSONData = {
            QRType: 'REQUEST_CRED',
            serviceEndpoint:  baseUrl + 'hs/api/v2/auth?challenge=' + challenge,
            schemaId: this.schemaId,
            appDid: this.appDid,
            appName: this.appName
        }

        return JSONData;
    }

    checkSlash(baseUrl) {
        if(!baseUrl) throw new Error("baseUrl is null or empty");
        baseUrl = baseUrl.trim();
        if (!baseUrl.endsWith('/')) 
            return baseUrl + '/';
        else
            return baseUrl;
    }
    
    initiate() {
        const wss = new WebSocket.server({
            httpServer: this.server, // Tieing websocket to HTTP server
            autoAcceptConnections: false
        })
        const that =  this;
        wss.on('request', async (request) => {
            const connection = request.accept(null, request.origin)
            console.log(`HS-AUTH:: Client connected`)
            
            const clientId = await clientStore.addClient(connection);
            clientStore.emit('startTimer', {clientId: clientId, time: 60000});
            
            const JSONData = that.getQRData(this.baseUrl ,clientId);

            connection.sendUTF(getFormatedMessage('init', JSONData));
            connection.on('message', (m) => {

            })
            connection.on('close', (conn, clientId) => {
                if(conn == 4001 && clientId) {
                    clientStore.emit('deleteClient', { clientId });
                }
                console.log(`HS-AUTH:: Client disconnected`)                
            })
        })
    }
}