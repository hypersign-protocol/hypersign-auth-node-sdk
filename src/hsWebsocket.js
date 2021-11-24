const WebSocket = require('websocket')
const { clientStore, logger } = require('./config')
const { getFormatedMessage, checkSlash } =  require('./utils');



module.exports = class HSWebsocket {
    constructor(server, baseUrl, appDid, appName, schemaId, socketConnectionTimeOut = 60000, authResourcePath) {
        if (!server) throw new Error('Http server is required.')
        if (!baseUrl) throw new Error('Server baseUrl is required.')
        this.server = server;
        this.baseUrl = checkSlash(baseUrl);
        this.appDid = appDid;
        this.appName = appName;
        this.schemaId = schemaId;
        this.socketConnectionTimeOut = socketConnectionTimeOut;
        this.authResourcePath = authResourcePath.startsWith("/") ? authResourcePath.substring(1): authResourcePath ; 
    }

    getQRData(challenge){
        const JSONData = {
            QRType: 'REQUEST_CRED',
            serviceEndpoint:  this.baseUrl + this.authResourcePath,
            schemaId: this.schemaId,
            appDid: this.appDid,
            appName: this.appName,
            challenge
        }

        return JSONData;
    }

    initiate() {
        const wss = new WebSocket.server({
            httpServer: this.server, // Tieing websocket to HTTP server
            autoAcceptConnections: false
        })
        const that = this;
        wss.on('request', (request) => {
            const connection = request.accept(null, request.origin)
            logger.debug(`HS-AUTH:: Client connected`)
            
            const clientId = clientStore.addClient(connection);
            clientStore.emit('startTimer', {clientId: clientId, time: this.socketConnectionTimeOut});
            
            const JSONData = that.getQRData(clientId);

            connection.sendUTF(getFormatedMessage('init', JSONData));
            connection.on('message', (m) => {

            })
            connection.on('close', (conn, clientId) => {
                if(conn == 4001 && clientId) {
                    clientStore.emit('deleteClient', { clientId });
                }
                logger.debug(`HS-AUTH:: Client disconnected`)                
            })
        })
    }
}