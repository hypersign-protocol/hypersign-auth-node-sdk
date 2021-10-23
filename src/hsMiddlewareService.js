const jwt = require('jsonwebtoken');
const hsSdk = require('hs-ssi-sdk');
const regMailTemplate = require('./mail.template');
const MailService = require('./mail.service');
const { clientStore } = require('./config');
const fetch = require('node-fetch');
const { v4: uuid4 } = require('uuid');

const TokenStore = require('./tokenStore')

const tokenStore= new TokenStore()
module.exports = class HSMiddlewareService {
    constructor(options = {}, baseUrl) {
        this.options = {};
        this.options.jwtExpiryTime = options ? options.jwt.expiryTime : 240000;
        this.options.rftokenExpiryTime = options ? options.rft.expiryTime : 1000;
        this.options.jwtSecret = options ? options.jwt.secret : 'secretKey';
        this.options.rftokenSecret=options ? options.rft.secret :'8e5507e12da789f3c3bd640711378201d658657999384061bb';
        this.options.hsNodeUrl = options ? options.networkUrl : 'https://ssi.hypermine.in/core'
        this.options.mail = options ? options.mail : mail;
        const hypersignSSISdk =  new hsSdk({nodeUrl: this.options.hsNodeUrl});
        this.hsSdkVC = hypersignSSISdk.credential;
        this.baseUrl = baseUrl;

        this.baseUrl = this.sanetizeUrl(this.baseUrl);
        this.options.hsNodeUrl = this.sanetizeUrl(this.options.hsNodeUrl)

        this.options.keys = options.keys;
        this.options.schemaId = options.schemaId;

        this.options.mail = options.mail;


        this.options.appCredential = options.appCredential;
        this.developerDashboardVerifyApi = `${this.sanetizeUrl(options.developerDashboardUrl)}/hs/api/v2/subscription/verify`;

        this.mailService = this.options.mail && this.options.mail.host != "" ? new MailService({...this.options.mail }) : null;


        this.apiAuthToken = "";
        this.isSubscriptionSuccess = false;
        this.isSubcriptionEnabled = options.isSubcriptionEnabled;
    }

    sanetizeUrl(url) {
        if (!url) throw new Error("Url is empty");
        if (url.substr(url.length - 1) == '/') {
            return url.substr(0, url.length - 1)
        } else return url;
    }

    async verifyPresentation(vpObj, challenge) {
        if (!vpObj) throw new Error('presentation is null')
        if (!challenge) throw new Error('challenge is null')
        const vc = vpObj.verifiableCredential[0];
        const isVerified = await this.hsSdkVC.verifyPresentation({
            presentation: vpObj,
            challenge: challenge,
            issuerDid: vc.proof.verificationMethod,
            holderDid: vpObj.proof.verificationMethod
        });
        return isVerified.verified;
    }

    async generateCredential(userData) {
        const schemaUrl = this.options.hsNodeUrl + '/api/v1/schema/' + this.options.schemaId;
        const issuerKeys = this.options.keys;
        const { did } = userData;

        // removing unwanted fields since they got added by JWT
        delete userData['iat'];
        delete userData['exp'];
        delete userData['did'];

        console.log("HS-AUTH:: Credential is being generated...")
        const credential = await this.hsSdkVC.generateCredential(schemaUrl, {
            subjectDid: did,
            issuerDid: issuerKeys.publicKey.id,
            expirationDate: new Date().toISOString(),
            attributesMap: userData,
        })

        console.log("HS-AUTH:: Credential is being signed...")
        const signedCredential = await this.hsSdkVC.signCredential(credential, issuerKeys.publicKey.id, issuerKeys.privateKeyBase58)
        return signedCredential
    }

    async generatePresentation() {
        const issuerKeys = this.options.keys;
        const presentation = await this.hsSdkVC.generatePresentation(
            this.options.appCredential,
            issuerKeys.publicKey.id
        );
        const challenge = uuid4();
        const signedPresentation = await this.hsSdkVC.signPresentation(presentation, issuerKeys.publicKey.id, issuerKeys.privateKeyBase58, challenge)
        return signedPresentation
    }

    async fetchData(url, options) {
        const resp = await fetch(url, options)
        const json = await resp.json();
        return json;
    }

    async callSubscriptionAPIwithPresentation() {
        const data = await this.generatePresentation();
        const json = await this.fetchData(this.developerDashboardVerifyApi, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data)
        })

        if (json.status == 200) {
            this.isSubscriptionSuccess = true;
            this.apiAuthToken = json.message;
        } else if (json.status == 401) {
            throw new Error('Unauthorized subscription API access');
        } else {
            throw new Error(json.error);
        }
    }

    async checkSubscription() {
        if (this.apiAuthToken == "") {
            console.log('HS-AUTH:: No API Authorization token found, authenticating using verifiable presentation');
            await this.callSubscriptionAPIwithPresentation();
        } else {
            console.log('HS-AUTH:: Found API Authorization token, trying to authorize');
            const developerPortalAPI = `${this.developerDashboardVerifyApi}?apiAuthToken=${this.apiAuthToken}`;
            const json = await this.fetchData(developerPortalAPI, {
                method: 'POST',
            });

            if (json.status == 200) {
                this.isSubscriptionSuccess = true;
            } else if (json.status == 403) {
                console.log('HS-AUTH:: API Authorization token has expired. Trying to authentication again using verifiable presentation');
                await this.callSubscriptionAPIwithPresentation();
            } else {
                throw new Error(json.error);
            }
        }
    }

    // Public methods
    /////////////////
    async authenticate(body) {
        const { challenge, vp } = body;
        if(this.isSubcriptionEnabled){
            await this.checkSubscription();
            if (!this.isSubscriptionSuccess) throw new Error('Subscription check unsuccessfull')
        }
        
        const vpObj = JSON.parse(vp);
        const subject = vpObj['verifiableCredential'][0]['credentialSubject'];

        console.log("HS-AUTH:: Presentation is being verified...")

        if (!(await this.verifyPresentation(vpObj, challenge))) throw new Error('Could not verify the presentation')

        // TODO:  need to find out if we are missing any imp parameter in the options.
        // what is the proper way to JWT sign 
        const accessToken = await jwt.sign(subject, this.options.jwtSecret, { expiresIn: this.options.jwtExpiryTime });
        const refreshToken= await jwt.sign(subject, this.options.rftokenSecret, { expiresIn: this.options.rftokenExpiryTime })

        // TODO:  once we use redis , we can set the expiration time = this.options.rftokenExpiryTime also
        // but for in-mem, let;s keep it simple
        await tokenStore.set(subject.id, refreshToken, this.options.rftokenExpiryTime)

        const client = clientStore.getClient(challenge)
       
        if(client.connection){
            client.connection.sendUTF(this.getFormatedMessage('end', { message: 'User is validated. Go to home page.',tokens: { accessToken, refreshToken }}))
        }
        
        clientStore.deleteClient(client.clientId);
        console.log("HS-AUTH:: Finished.")
        
        // TODO:: I think we need to not send the `user` property with this, 
        // we can simply send the accessTokena and refrehToken and then user can use authorize middleware to get user data
        // need to find out what is the proper way to doing it
        return {
            user: subject,
            accessToken,
            refreshToken,
        }
    }

   async verifyRfToken(did,refresh_token){
        return new Promise((resovle,reject)=>{
            const did_tokens=did_store.get(did)
            if(refresh_token===did_tokens.refresh_token){
                resovle(true)
            }else{
                reject(new Error("Refresh Token Error: Token Not Found "))
            }
        })
    }

    async verifyRefreshToken(refreshToken) {
        return await jwt.verify(refreshToken, this.options.rftokenSecret)
    }
    
    async refresh(refreshToken){
        const payload = await this.verifyRefreshToken(refreshToken)

        // TODO: we need to check if this refresh token was present in the store.
        const refTokenStored = await tokenStore.get(payload.id)
        
        if(refTokenStored != refreshToken){
            throw new Error("Unauthorized: Invalid ref token or expired")
        }

        delete payload["exp"]
        delete payload["iat"]
        const accessToken = await jwt.sign(payload, this.options.jwtSecret, { expiresIn: this.options.jwtExpiryTime })
        const refToken = await jwt.sign(payload, this.options.rftokenSecret, { expiresIn: this.options.rftokenExpiryTime })

        // TODO::  store the ref token using key value , user did as key
        // Store the tokens in key val
        // TODO:  once we use redis , we can set the expiration time = this.options.rftokenExpiryTime also
        // but for in-mem, let;s keep it simple
        await tokenStore.set(payload.id, refToken, this.options.rftokenExpiryTime) // the expirey time is in second
        
        return {
            accessToken,
            refreshToken: refToken
        }
    }

    async authorize(authToken) {
        return await jwt.verify(authToken, this.options.jwtSecret)
    }
    
    async register(user, isThridPartyAuth = false) {
        if(!this.mailService) throw new Error("Mail configuration is not defined");
        
        if(!user)  throw new Error("User object is null or empty.")

        if(isThridPartyAuth){
            const { did } = user;
            
            if(!did) throw new Error("Did must be passed with thirdparty auth request");
            
            const verifiableCredential = await this.generateCredential(user);
            return verifiableCredential;
        }

        const token = await jwt.sign(user, this.options.jwtSecret, { expiresIn: this.options.jwtExpiryTime })
        let link = `${this.baseUrl}/hs/api/v2/credential?token=${token}`;
        let mailTemplate = regMailTemplate;
        mailTemplate = mailTemplate.replace(/@@APPNAME@@/g, this.options.mail.name);
        mailTemplate = mailTemplate.replace('@@RECEIVERNAME@@', user.name);
        mailTemplate = mailTemplate.replace('@@LINK@@', link);
        const JSONdata = JSON.stringify({
            QRType: 'ISSUE_CRED',
            url: link
        });
        const deepLinkUrl = encodeURI('https://ssi.hypermine.in/hsauth/deeplink.html?deeplink=hypersign:deeplink?url=' + JSONdata);
        mailTemplate = mailTemplate.replace("@@DEEPLINKURL@@", deepLinkUrl);
        
        if(!user.email) throw new Error("No email is passed. Email is required property");
        const info = await this.mailService.sendEmail(user.email, mailTemplate, `${this.options.mail.name} Auth Credential Issuance`);
        return null;
    }

    async getCredential(token, userDid) {
        const data = await jwt.verify(token, this.options.jwtSecret)
        data.did = userDid;
        const verifiableCredential = await this.generateCredential(data);
        return verifiableCredential
    }

    getFormatedMessage(op, data) {
        return JSON.stringify({
            op,
            data
        })
    }


}