const HSWebsocket = require('./hsWebsocket');
const HypersignAuthService = require('./hsAuthService');
const fs = require('fs');
const path = require('path');
const { clientStore, logger } = require('./config');
const { extractToken, extractRfToken, responseMessageFormat, isDate } = require('./utils');
const { randomUUID } = require('crypto');

const HYPERSIGN_CONFIG_FILE = 'hypersign.json';


const hidNetworkUrls = Object.freeze({
    testnet: {
        rpc: 'https://rpc.jagrat.hypersign.id/',
        rest: 'https://api.jagrat.hypersign.id/',
    }
})


const hsJson = {
    "networkUrl": "https://rpc.jagrat.hypersign.id/",
    "networkRestUrl": "https://api.jagrat.hypersign.id/",
    "jwt": {
        "secret": "00c2c433-a077-4e68-b19c-1234f014a510",
        "expiryTime": 120000
    },
    "rft": {
        "secret": "00c2c433-a077-4e68-b19c-1234f014a510",
        "expiryTime": 120000
    },
    "appCredential": {
        "credentialSubject": {
            "name": "Entity Developer Dashboard",
            "did": "did:hid:testnet:z8uyZoEA2JTCMWfadrSPaqyWmwzwc3qAwAM4snVrfLKue",
            "owner": "did:hid:testnet:z8uyZoEA2JTCMWfadrSPaqyWmwzwc3qAwAM4snVrfLKue",
            "schemaId": "sch:hid:testnet:zufjU7LuQuJNFiUpuhCwYkTrakUu1VmtxE9SPi5TwfUB:1.0",
            "serviceEp": "http://localhost:3002",
            "verifyResourcePath": "",
            "id": "did:hid:testnet:z8uyZoEA2JTCMWfadrSPaqyWmwzwc3qAwAM4snVrfLKue",
        }
    },
    "namespace": "testnet",
    isSubcriptionEnabled: false,
}


module.exports = class HypersignAuth {

    constructor(server, offlineSigner, options = {}) {
        ////
        // Making it backward compatible
        const hsFilePath = path.join(__dirname, '../../../', HYPERSIGN_CONFIG_FILE);
        const hsFilePathDev = path.join(__dirname, '../', HYPERSIGN_CONFIG_FILE)
        let hypersignConfig;
        let hsConfigJson;
        if (!fs.existsSync(hsFilePath) && !fs.existsSync(hsFilePathDev)) {
            if (options.accessToken) {
                Object.assign(hsJson.jwt, options.accessToken)
            } else {
                hsJson.jwt.secret = randomUUID()
                hsJson.jwt.expiryTime = 120000
            }

            if (options.refreshToken) {
                Object.assign(hsJson.rft, options.refreshToken)
            } else {
                hsJson.rft.secret = randomUUID()
                hsJson.rft.expiryTime = 120000
            }

            if (options.networkUrl && options.networkUrl != '') {
                hsJson.networkUrl = options.networkUrl
            } else {
                hsJson.networkUrl = hidNetworkUrls.testnet.rpc
            }

            if (options.networkRestUrl && options.networkRestUrl != "") {
                hsJson.networkRestUrl = options.networkRestUrl
            } else {
                hsJson.networkRestUrl = hidNetworkUrls.testnet.rest
            }

            if (options.serviceName && options.serviceName != "") {
                hsJson.appCredential.credentialSubject.name = options.serviceName
            } else {
                throw new Error("serviceName property is required")
            }

            if (options.schemaId && options.schemaId != "") {
                hsJson.appCredential.credentialSubject.schemaId = options.schemaId
            } else {
                throw new Error("schemaId property is required")
            }

            if (options.serviceEp && options.serviceEp != "") {
                hsJson.appCredential.credentialSubject.serviceEp = options.serviceEp
            } else {
                throw new Error("serviceEp property is required")
            }

            if (options.verifyResourcePath) {
                hsJson.appCredential.credentialSubject.verifyResourcePath = options.verifyResourcePath
            }



            hsConfigJson = hsJson;
        } else {
            hypersignConfig = fs.readFileSync(HYPERSIGN_CONFIG_FILE);
            hsConfigJson = JSON.parse(hypersignConfig);
        }

        // TODO: we can delete this later. this is to make backward compatibility
        hsConfigJson.appCredential.credentialSubject.authResourcePath = !hsConfigJson.appCredential.credentialSubject.authResourcePath ? "hs/api/v2/auth" : hsConfigJson.appCredential.credentialSubject.authResourcePath;
        hsConfigJson.appCredential.credentialSubject.baseUrl = !hsConfigJson.appCredential.credentialSubject.baseUrl ? hsConfigJson.appCredential.credentialSubject.serviceEp : hsConfigJson.appCredential.credentialSubject.baseUrl;

        if (hsConfigJson.keys == {}) throw new Error('Cryptographic keys is not set');
        if (hsConfigJson.networkUrl == "") throw new Error('Network RPC Url is not set');
        if (hsConfigJson.networkRestUrl == "") throw new Error('Network REST Url is not set');
        if (hsConfigJson.appCredential == {}) throw new Error('App Credential is not set');
        if (hsConfigJson.appCredential.credentialSubject == {}) throw new Error('Invalid credentialSubject');
        if (!hsConfigJson.appCredential.credentialSubject.baseUrl) throw new Error("BaseUrl is not present in hypersign.json");
        if (!hsConfigJson.appCredential.credentialSubject.authResourcePath) throw new Error("AuthResourcePath is not present in hypersign.json");
        if (!hsConfigJson.namespace) {
            logger.debug('DID namespace is not passed. Continuing with mainnet')
        }

        this.options = {
            keys: {},
            mail: {},
            jwt: {},
            rft: {},
            appCredential: {},
            offlineSigner,
            namespace: "",
            namespace: "testnet"
        };
        Object.assign(this.options.mail, hsConfigJson.mail);
        Object.assign(this.options.keys, hsConfigJson.keys);
        Object.assign(this.options.appCredential, hsConfigJson.appCredential);

        this.options.networkUrl = hsConfigJson.networkUrl;
        this.options.hidNodeRestURL = hsConfigJson.networkRestUrl;
        this.options.namespace = hsConfigJson.namespace;

        this.options.schemaId = hsConfigJson.appCredential.credentialSubject.schemaId;
        this.options.developerDashboardUrl = hsConfigJson.developerDashboardUrl ? hsConfigJson.developerDashboardUrl : 'https://ssi.hypermine.in/developer/';

        if (!hsConfigJson.jwt) {
            const jwtDefault = {
                secret: randomUUID(),
                expiryTime: '900s' // epires in 15 mins
            }
            Object.assign(this.options.jwt, jwtDefault)
            logger.debug('AccessToken configuration not passed. Taking default configuration.. Secret = ' + jwtDefault.secret + ' ExpiryTime = ' + jwtDefault.expiryTime)
        } else {
            Object.assign(this.options.jwt, hsConfigJson.jwt)
        }
        if (!hsConfigJson.rft) {
            const rftDefault = {
                secret: randomUUID(),
                expiryTime: '900s' // epires in 15 mins
            }
            Object.assign(this.options.rft, rftDefault)
            logger.debug('Refresh Token configuration not passed. Taking default configuration.. Secret = ' + rftDefault.secret + ' ExpiryTime = ' + rftDefault.expiryTime)
        } else {
            Object.assign(this.options.rft, hsConfigJson.rft)
        }

        this.ws = new HSWebsocket(server,
            hsConfigJson.appCredential.credentialSubject.baseUrl,
            hsConfigJson.appCredential.credentialSubject.did,
            hsConfigJson.appCredential.credentialSubject.name,
            this.options.schemaId,
            hsConfigJson.socketConnTimeOut,
            hsConfigJson.appCredential.credentialSubject.authResourcePath);
        this.ws.initiate();

        this.options["isSubcriptionEnabled"] = hsConfigJson["isSubcriptionEnabled"] != undefined ? hsConfigJson["isSubcriptionEnabled"] : true;

    }

    async init() {
        this.middlewareService = new HypersignAuthService(this.options, this.options.appCredential.credentialSubject.baseUrl);
        await this.middlewareService.init();
    }

    /**
     * Authenticate a user by verifying verifiable presentation sent by a user via wallet
     * @param { Request } req 
     * @param { Response } res 
     * @param { Next } next 
     */
    async authenticate(req, res, next, appUserId = '') {
        try {
            const data = await this.middlewareService.authenticate(req.body, appUserId);
            Object.assign(req.body, { ...responseMessageFormat(true, "Authenticated successfully", { ...data }) });
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
    async refresh(req, res, next) {
        try {
            const refreshToken = extractRfToken(req);
            if (!refreshToken) throw new Error("Unauthorized: Refresh Token is not sent in header")

            const newtokens = await this.middlewareService.refresh(refreshToken);
            Object.assign(req.body, { ...responseMessageFormat(true, "New pair of tokens", { ...newtokens }) });
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
    async logout(req, res, next) {
        try {
            const refreshToken = extractRfToken(req);
            if (!refreshToken) throw new Error("Unauthorized: Refresh Token is not sent in header")

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
            Object.assign(req.body, { ...responseMessageFormat(true, "Authorized successfully", { ...userData }) });
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
            const { user, isThridPartyAuth, expirationDate } = req.body;
            if (!expirationDate) {
                return res.status(400).send(responseMessageFormat(false, 'Creadential expirationDate must be passed'));
            }
            if (!isDate(expirationDate)) {
                return res.status(400).send(responseMessageFormat(false, 'Invalid expirationDate; It must be a datetime field'));
            }
            if (!user) {
                return res.status(400).send(responseMessageFormat(false, 'user object is not passed in the body'));
            }
            const vc = await this.middlewareService.register(user, isThridPartyAuth ? isThridPartyAuth : false, expirationDate);
            if (vc) {
                Object.assign(req.body, { ...responseMessageFormat(true, "Verifiable Credential", { ...vc }) });
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
            if (!authToken) {
                return res.status(400).send(responseMessageFormat(false, 'token is not passed in the in query'));
            }

            if (!userDid) {
                return res.status(400).send(responseMessageFormat(false, 'did is not passed in the in query'));
            }

            const vc = await this.middlewareService.getCredential(authToken, userDid);
            Object.assign(req.body, { ...responseMessageFormat(true, "Verifiable Credential", { ...vc }) });
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
    async challenge(req, res, next) {
        try {
            const clientId = clientStore.addClient(null);
            clientStore.emit('startTimer', { clientId: clientId, time: 120000 });
            const QRData = this.ws.getQRData(clientId);
            Object.assign(req.body, { ...responseMessageFormat(true, "New session data", QRData) })
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
    async poll(req, res, next) {
        try {
            let challenge;
            if (req.query && req.query.challenge) {
                challenge = req.query.challenge;
            } else if (req.body && req.body.challenge) {
                challenge = req.body.challenge;
            }
            if (!challenge) {
                return res.status(400).send(responseMessageFormat(false, "Challenge is not passed in the request body or query parameter"))
            }
            const tokens = await this.middlewareService.poll({ challenge });
            Object.assign(req.body, { ...responseMessageFormat(true, 'User is authenticated', { ...tokens }) })
            next();
        } catch (e) {
            res.status(401).send(responseMessageFormat(false, e.message));
        }
    }

}