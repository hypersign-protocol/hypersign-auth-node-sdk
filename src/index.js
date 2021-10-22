const HSWebsocket = require('./hsWebsocket');
const HSMiddlewareService = require('./hsMiddlewareService');
const fs = require('fs');
const path = require('path');
const { clientStore } = require('./config');


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
        
        if (hsConfigJson.keys == {}) throw new Error('Cryptographic keys is not set');
        if (hsConfigJson.networkUrl == "") throw new Error('Network Url is not set');
        if (hsConfigJson.appCredential == {}) throw new Error('App Credential is not set');
        if (hsConfigJson.appCredential.credentialSubject == {}) throw new Error('Invalid credentialSubject');


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
            console.log('HS-AUTH:: JWT configuration not passed. Taking default configuration.. Secret = ' + jwtDefault.secret + ' ExpiryTime = ' + jwtDefault.expiryTime)
        } else {
            Object.assign(options.jwt, hsConfigJson.jwt)
        }
        if (!hsConfigJson.rft) {
            const rftDefault = {
                secret: 'BadsecretKey1@',
                expiryTime: '900s' // epires in 15 mins
            }
            Object.assign(options.rft, rftDefault)
            console.log('HS-AUTH:: Refresh Token configuration not passed. Taking default configuration.. Secret = ' + rftDefault.secret + ' ExpiryTime = ' + rftDefault.expiryTime)
        } else {
            Object.assign(options.rft, hsConfigJson.rft)
        }

        this.ws = new HSWebsocket(server,
            hsConfigJson.appCredential.credentialSubject.serviceEp,
            hsConfigJson.appCredential.credentialSubject.did,
            hsConfigJson.appCredential.credentialSubject.name,
            options.schemaId,
            hsConfigJson.socketConnTimeOut);
        this.ws.initiate();

        options["isSubcriptionEnabled"] = hsConfigJson["isSubcriptionEnabled"] != undefined ? hsConfigJson["isSubcriptionEnabled"] : true;
        this.middlewareService = new HSMiddlewareService(options, hsConfigJson.appCredential.credentialSubject.serviceEp);

    }


    extractToken(req) {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            return req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.token) {
            return req.query.token;
        }
        return null;
    }
    extractRfToken(req) {
        if (req.headers.refresh_token && req.headers.refresh_token.split(' ')[0] === 'Bearer') {
            return req.headers.refresh_token.split(' ')[1];
        
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

    



    async refresh(req ,res ,next){
        try {
            
            const jwt_token = this.extractToken(req);
            if(!jwt_token)throw new Error("Authorization Token is not sent to header")
            const refresh_token= this.extractRfToken(req);
            if(!refresh_token)throw new Error("Refresh Token is not sent to header")
            const auth_data_rft=await this.middlewareService.authorizeRf(refresh_token)         
            try{
             const auth_data_jwt=await this.middlewareService.authorize(jwt_token)
                throw new Error("Jwt Not Expired, Cant Refresh")
            } catch(e){
              if(e.message==="jwt expired"){
                try {
                    let decode_jwt=await this.middlewareService.decode(jwt_token)
                       const subject= await this.middlewareService.verifydid(decode_jwt.id) 
                       
                        //if did doesnot exists it will never come to this line will get rejected from pervious line 
                        await this.middlewareService.verifyRfToken(decode_jwt.id,refresh_token);
                        req.body.freshCredential=await this.middlewareService.issueCredentialFresh(subject); 
                        //ToDo: delete refresh token and jwt and issue new ones
                    } catch (error) {
                        
                            throw error;             
                    }    
                    
              }else{
                  throw e;
              }
           
            }
           // const rft_sign_status=this.middlewareService.authorizeRf(refresh_token)

            
           // console.log(jwt_sign_status , rft_sign_status);
           // expire detection 
           // check integrity
           // check local store
           //chcek did
           
            //req.body.hsFreshTokens=await this.middlewareService.refresh(jwt_token,refresh_token);
         
            next()
            // this.middlewareService.refresh(jwt_token,)

        } catch (error) {
            console.log(error);
            //throw error;
            res.status(401).send(error.message)
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

    async newSession(req, res, next){
        try {
            const { baseUrl } = req.body;
            if(!baseUrl) throw new Error("BaseUrl is not passed");
            const clientId = clientStore.addClient(null);
            clientStore.emit('startTimer', {clientId: clientId, time: 60000});
            const QRData = this.ws.getQRData(baseUrl, clientId);
            req.body.qrData = QRData;
            next();
        } catch (e) {
            console.log(e)
            res.status(500).send(e.message);
        }
    }

}