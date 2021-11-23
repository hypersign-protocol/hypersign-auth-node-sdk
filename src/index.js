const HSWebsocket = require('./hsWebsocket');
const HSMiddlewareService = require('./hsMiddlewareService');
const fs = require('fs');
const path = require('path');
const { clientStore } = require('./config');
const { responseMessageFormat } = require('./utils');

const HYPERSIGN_CONFIG_FILE = 'hypersign.json';

module.exports = class HypersignAuth {

    constructor(server) {
        ////
        // Making it backward compatible
        const hsFilePath = path.join(__dirname, '../../../', HYPERSIGN_CONFIG_FILE);
        if (!fs.existsSync(hsFilePath)) throw new Error(HYPERSIGN_CONFIG_FILE + ' file does not exist. Generate ' + HYPERSIGN_CONFIG_FILE + ' file from the developer dashboard; filePath = ' + hsFilePath);

        const hypersignConfig = fs.readFileSync(HYPERSIGN_CONFIG_FILE);
        const hsConfigJson = JSON.parse(hypersignConfig);

        if (hsConfigJson.keys == {}) throw new Error('Cryptographic keys is not set');
        if (hsConfigJson.networkUrl == "") throw new Error('Network Url is not set');
        if (hsConfigJson.appCredential == {}) throw new Error('App Credential is not set');
        if (hsConfigJson.appCredential.credentialSubject == {}) throw new Error('Invalid credentialSubject');
        if(!hsConfigJson.appCredential.credentialSubject.serviceEp) throw new Error("Service Enpoint is not present in hypersign.json");

        const options = {
            keys: {},
            mail: {},
            jwt: {},
            appCredential: {}
        };
        Object.assign(options.mail, hsConfigJson.mail);
        Object.assign(options.keys, hsConfigJson.keys);
        Object.assign(options.appCredential, hsConfigJson.appCredential);

        options.networkUrl = hsConfigJson.networkUrl;
        options.schemaId = hsConfigJson.appCredential.credentialSubject.schemaId;
        options.developerDashboardUrl = hsConfigJson.developerDashboardUrl ? hsConfigJson.developerDashboardUrl : 'https://ssi.hypermine.in/developer/';

        if (!hsConfigJson.jwt) {
            const jwtDefault = {
                secret: 'BadsecretKey1@',
                expiryTime: '900s' // epires in 15 mins
            }
            Object.assign(options.jwt, jwtDefault)
            console.log('HS-AUTH:: JWT configuration not passed. Taking default configuration.. Secret = ' + jwtDefault.secret + ' ExpiryTime = ' + jwtDefault.expiryTime)
        } else {
            Object.assign(options.jwt, hsConfigJson.jwt)
        }

        this.serviceEndPoint = hsConfigJson.appCredential.credentialSubject.serviceEp;
        this.ws = new HSWebsocket(server,
            this.serviceEndPoint,
            hsConfigJson.appCredential.credentialSubject.did,
            hsConfigJson.appCredential.credentialSubject.name,
            options.schemaId,
            hsConfigJson.socketConnTimeOut);
        this.ws.initiate();

        options["isSubcriptionEnabled"] = hsConfigJson["isSubcriptionEnabled"] != undefined ? hsConfigJson["isSubcriptionEnabled"] : true;
        this.middlewareService = new HSMiddlewareService(options, this.serviceEndPoint);

    }


    extractToken(req) {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            return req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.token) {
            return req.query.token;
        }
        return null;
    }

    // Public methods
    //////////////////

    async authenticate(req, res, next) {
        try {
            req.body.hsUserData = await this.middlewareService.authenticate(req.body);
            next();
        } catch (e) {
            console.log(e)
            res.status(401).send(e.message);
        }
    }


    async authorize(req, res, next) {
        try {
            const authToken = this.extractToken(req);
            if (!authToken) throw new Error('Authorization token is not passed in the header')
            req.body.userData = await this.middlewareService.authorize(authToken);
            next();
        } catch (e) {
            console.log(e)
            res.status(403).send(e.message);
        }
    }

    async register(req, res, next) {
        try {
            if (!req.body) throw new Error('User data is not passed in the body: req.body.userData')            
            const vc = await this.middlewareService.register(req.body["user"], req.body["isThridPartyAuth"]? req.body["isThridPartyAuth"]: false );
            if(vc){
                req.body.verifiableCredential = vc;
            }
            next();
        } catch (e) {
            console.log(e)
            res.status(500).send(e.message);
        }
    }

    async issueCredential(req, res, next) {
        try {
            const authToken = req.query.token;
            const userDid = req.query.did
            if (!authToken) throw new Error('Registration token is not passed in the in query')
            if (!userDid) throw new Error('User Did is not passed in the in query')
            req.body.verifiableCredential = await this.middlewareService.getCredential(authToken, userDid);
            next();
        } catch (e) {
            console.log(e)
            res.status(500).send(e.message);
        }
    }

    async challenge(req, res, next){
        try {
            if(!this.serviceEndPoint) {
                return res.status(400).send(responseMessageFormat(false, "Service Enpoint is not present in hypersign.json. Contact admin."))
            } 
            const clientId = clientStore.addClient(null);
            clientStore.emit('startTimer', {clientId: clientId, time: 60000});
            const QRData = this.ws.getQRData(this.serviceEndPoint, clientId);
            Object.assign(req.body, {...responseMessageFormat(true, "QRData", QRData)})
            next();
        } catch (e) {
            res.status(400).send(responseMessageFormat(false, e.message));
        }
    }

    async poll(req, res, next){
        try {
            let challenge;
            if(req.query && req.query.challenge){
                challenge = req.query.challenge;
            } else if(req.body && req.body.challenge){
                challenge = req.body.challenge;
            }
            if(!challenge){
                return res.status(400).send(responseMessageFormat(false, "Challenge is not passed in the request body or query parameter"))
            }
            const authToken = await this.middlewareService.poll({ challenge });
            Object.assign(req.body, {...responseMessageFormat(true, 'User is authenticated', { authToken })})
            next();
        } catch (e) {
            res.status(401).send(responseMessageFormat(false, e.message));
        }
    }

}