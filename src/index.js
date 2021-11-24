const HSWebsocket = require('./hsWebsocket');
const HypersignAuthService = require('./hsAuthService');
const fs = require('fs');
const path = require('path');
const { clientStore, logger } = require('./config');
const { extractToken, extractRfToken, responseMessageFormat } =  require('./utils');


const HYPERSIGN_CONFIG_FILE = 'hypersign.json';

module.exports = class HypersignAuth {

    constructor(server) {
        ////
        // Making it backward compatible
        const hsFilePath = path.join(__dirname, '../../../', HYPERSIGN_CONFIG_FILE);
        const hsFilePathDev=path.join(__dirname,'../', HYPERSIGN_CONFIG_FILE)
        if (!fs.existsSync(hsFilePath)&& !fs.existsSync(hsFilePathDev)) throw new Error(HYPERSIGN_CONFIG_FILE + ' file does not exist. Generate ' + HYPERSIGN_CONFIG_FILE + ' file from the developer dashboard; filePath = ' + hsFilePath);

        const hypersignConfig = fs.readFileSync(HYPERSIGN_CONFIG_FILE);
        
        const hsConfigJson = JSON.parse(hypersignConfig);

        // TODO: we can delete this later. this is to make backward compatibility
        hsConfigJson.appCredential.credentialSubject.authResourcePath = 
            !hsConfigJson.appCredential.credentialSubject.authResourcePath ? "hs/api/v2/auth" : hsConfigJson.appCredential.credentialSubject.authResourcePath;
        hsConfigJson.appCredential.credentialSubject.baseUrl = 
            !hsConfigJson.appCredential.credentialSubject.baseUrl ? hsConfigJson.appCredential.credentialSubject.serviceEp : hsConfigJson.appCredential.credentialSubject.baseUrl;


        if (hsConfigJson.keys == {}) throw new Error('Cryptographic keys is not set');
        if (hsConfigJson.networkUrl == "") throw new Error('Network Url is not set');
        if (hsConfigJson.appCredential == {}) throw new Error('App Credential is not set');
        if (hsConfigJson.appCredential.credentialSubject == {}) throw new Error('Invalid credentialSubject');
        if (!hsConfigJson.appCredential.credentialSubject.baseUrl) throw new Error("BaseUrl is not present in hypersign.json");
        if (!hsConfigJson.appCredential.credentialSubject.authResourcePath) throw new Error("AuthResourcePath is not present in hypersign.json");

        const options = {
            keys: {},
            mail: {},
            jwt: {},
            rft:{},
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
            logger.debug('HS-AUTH:: JWT configuration not passed. Taking default configuration.. Secret = ' + jwtDefault.secret + ' ExpiryTime = ' + jwtDefault.expiryTime)
        } else {
            Object.assign(options.jwt, hsConfigJson.jwt)
        }
        if (!hsConfigJson.rft) {
            const rftDefault = {
                secret: 'BadsecretKey1@',
                expiryTime: '900s' // epires in 15 mins
            }
            Object.assign(options.rft, rftDefault)
            logger.debug('HS-AUTH:: Refresh Token configuration not passed. Taking default configuration.. Secret = ' + rftDefault.secret + ' ExpiryTime = ' + rftDefault.expiryTime)
        } else {
            Object.assign(options.rft, hsConfigJson.rft)
        }

        this.ws = new HSWebsocket(server,
            hsConfigJson.appCredential.credentialSubject.baseUrl,
            hsConfigJson.appCredential.credentialSubject.did,
            hsConfigJson.appCredential.credentialSubject.name,
            options.schemaId,
            hsConfigJson.socketConnTimeOut,
            hsConfigJson.appCredential.credentialSubject.authResourcePath);
        this.ws.initiate();

        options["isSubcriptionEnabled"] = hsConfigJson["isSubcriptionEnabled"] != undefined ? hsConfigJson["isSubcriptionEnabled"] : true;
        this.middlewareService = new HypersignAuthService(options, hsConfigJson.appCredential.credentialSubject.baseUrl);

    }

    /**
     * Authenticate a user by verifying verifiable presentation sent by a user via wallet
     * @param { Request } req 
     * @param { Response } res 
     * @param { Next } next 
     */
    async authenticate(req, res, next) {
        try {
            const data = await this.middlewareService.authenticate(req.body);
            Object.assign(req.body, {...responseMessageFormat(true, "Authenticated successfully", { ...data })});
            next();
        } catch (e) {
            logger.error(e)
            res.status(401).send(responseMessageFormat(false, e.message));
        }
    }

    /**
     * Generates accessToken and refreshToken pair 
     * Ref: https://www.rfc-editor.org/rfc/rfc6749#section-6
     * @param { Request } req 
     * @param { Response } res 
     * @param { Next } next  
     */
    async refresh(req, res, next){
        try {
            const refreshToken = extractRfToken(req);
            if(!refreshToken)throw new Error("Unauthorized: Refresh Token is not sent in header")

            const newtokens = await this.middlewareService.refresh(refreshToken); 
            Object.assign(req.body, {...responseMessageFormat(true, "New pair of tokens", { ...newtokens })});
            next()
        } catch (error) {
            logger.error(error.message)
            res.status(401).send(responseMessageFormat(false, e.message));
        }
    }

    /**
     * Logs out a user
     * @param { Request } req 
     * @param { Response } res 
     * @param { Next } next  
     */
    async logout(req, res, next){
        try {
            const refreshToken = extractRfToken(req);
            if(!refreshToken)throw new Error("Unauthorized: Refresh Token is not sent in header")

            await this.middlewareService.logout(refreshToken); 
            // everthing is ok but there is no content
            res.status(204).send();
        } catch (error) {
            logger.error(error.message)
            res.status(401).send(responseMessageFormat(false, e.message));
        }
    }
    
    /**
     * Verifies accessToken and returns payload
     * @param { Request } req 
     * @param { Response } res 
     * @param { Next } next  
     */
    async authorize(req, res, next) {
        try {
            const authToken = extractToken(req);
            if (!authToken) throw new Error('Authorization token is not passed in the header')
            const userData = await this.middlewareService.authorize(authToken)
            Object.assign(req.body, {...responseMessageFormat(true, "Authorized successfully", { ...userData })});
            next();
        } catch (e) {
            logger.error(e)
            res.status(403).send(responseMessageFormat(false, e.message));
        }
    }


    /**
     * Registers a new user and sends email
     * @param { Request } req 
     * @param { Response } res 
     * @param { Next } next 
     */
    async register(req, res, next) {
        try {
            if (!req.body) throw new Error('User data is not passed in the body: req.body.userData')            
            const vc = await this.middlewareService.register(req.body["user"], req.body["isThridPartyAuth"]? req.body["isThridPartyAuth"]: false );
            if(vc){
                Object.assign(req.body, {...responseMessageFormat(true, "Verifiable Credential", { ...vc })});
            }
            next();
        } catch (e) {
            logger.error(e)
            res.status(500).send(responseMessageFormat(false, e.message));
        }
    }

    /**
     * Verifies the verifiable credential  JWT and issues auth verifiable credential
     * @param { Request } req 
     * @param { Response } res 
     * @param { Next } next 
     */
    async issueCredential(req, res, next) {
        try {
            const authToken = req.query.token;
            const userDid = req.query.did
            if (!authToken) throw new Error('Registration token is not passed in the in query')
            if (!userDid) throw new Error('User Did is not passed in the in query')
            const vc = await this.middlewareService.getCredential(authToken, userDid);
            Object.assign(req.body, {...responseMessageFormat(true, "Verifiable Credential", { ...vc })});
            next();
        } catch (e) {
            logger.error(e)
            res.status(500).send(responseMessageFormat(false, e.message));
        }
    }

    /**
     * Generates QR data (with challenge) in case the service provider does not want to uee websocket and go with polling
     * @param { Request } req 
     * @param { Response } res 
     * @param { Next } next  
     */
    async challenge(req, res, next){
        try {
            const clientId = clientStore.addClient(null);
            clientStore.emit('startTimer', {clientId: clientId, time: 60000});
            const QRData = this.ws.getQRData(clientId);
            Object.assign(req.body, {...responseMessageFormat(true, "New session data", QRData)})
            next();
        } catch (e) {
            res.status(400).send(responseMessageFormat(false, e.message));
        }
    }

    /**
     * Call this to check if a user has authenticated or not via wallet
     * @param { Request } req 
     * @param { Response } res 
     * @param { Next } next  
     */
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
            const tokens = await this.middlewareService.poll({ challenge });
            Object.assign(req.body, {...responseMessageFormat(true, 'User is authenticated', { ...tokens })})
            next();
        } catch (e) {
            res.status(401).send(responseMessageFormat(false, e.message));
        }
    }

}