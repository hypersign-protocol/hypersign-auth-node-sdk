const WebSocket = require('websocket')
const { clientStore } = require('./config')

module.exports = class HSWebsocket {
    constructor(server, baseUrl, appDid, appName, schemaId) {
        if (!server) throw new Error('Http server is required.')
        if (!baseUrl) throw new Error('Server baseUrl is required.')
        this.server = server;
        this.baseUrl = baseUrl;
        this.appDid = appDid;
        this.appName = appName;
        this.schemaId = schemaId;
        this.checkSlash()
    }

    checkSlash() {
        if (!this.baseUrl.endsWith('/')) this.baseUrl = this.baseUrl + '/';
    }
    getFormatedMessage(op, data) {
        return JSON.stringify({
            op,
            data
        })
    }

    initiate() {
        const TIME = () => new Date();
        const wss = new WebSocket.server({
            httpServer: this.server, // Tieing websocket to HTTP server
            autoAcceptConnections: false
        })

        wss.on('request', (request) => {
            const connection = request.accept(null, request.origin)
            console.log(`${TIME()} Client connected`)
            const clientId = clientStore.addClient(connection);
            connection.sendUTF(this.getFormatedMessage('init', {
                serviceEndpoint: this.baseUrl + 'hs/api/v2/auth?challenge=' + clientId,
                schemaId: this.schemaId,
                appDid: this.appDid,
                appName: this.appName
            }));
            connection.on('message', (m) => {})
            connection.on('close', (conn) => {
                console.log(`${TIME()} disconnected`)
            })
        })
    }
}