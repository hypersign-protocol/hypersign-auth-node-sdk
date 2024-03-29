const jwt = require('jsonwebtoken');
const { HypersignSSISdk } = require('hs-ssi-sdk');
const regMailTemplate = require('./mail/mail.template');
const MailService = require('./mail/mail.service');
const { clientStore, tokenStore, logger } = require('./config');
const { v4: uuid4 } = require('uuid');
const { sanetizeUrl, getFormatedMessage, fetchData, responseMessageFormat } = require('./utils');


module.exports = class HypersignAuthService {

    constructor(options = {}, baseUrl) {
        this.options = {};
        this.options.namespace = options && options.namespace ? options.namespace : '';
        this.options.jwtExpiryTime = options && options.jwt.expiryTime ? options.jwt.expiryTime : 240000;
        this.options.rftokenExpiryTime = options && options.rft.expiryTime ? options.rft.expiryTime : 1000;
        this.options.jwtSecret = options && options.jwt.secret ? options.jwt.secret : 'secretKey';
        this.options.rftokenSecret = options && options.rft.secret ? options.rft.secret : '8e5507e12da789f3c3bd640711378201d658657999384061bb';
        this.options.hidNodeURL = options && options.networkUrl ? options.networkUrl : "http://localhost:26657"
        this.options.hidNodeRestURL = options && options.hidNodeRestURL ? options.hidNodeRestURL : "http://localhost:1317"
        this.options.mail = options && options.mail ? options.mail : mail;

        if (!options.offlineSigner) {
            throw new Error('OfflineSigner is required for initilizing Hypersign Auth Service')
        }
        this.options.offlineSigner = options.offlineSigner

        this.baseUrl = baseUrl;
        this.baseUrl = sanetizeUrl(this.baseUrl);
        this.options.hidNodeURL = sanetizeUrl(this.options.hidNodeURL)
        this.options.hidNodeRestURL = sanetizeUrl(this.options.hidNodeRestURL)

        this.options.keys = options.keys;

        // const hsSdk = new hsSdk({ nodeUrl: this.options.hidNodeURL });


        this.options.schemaId = options.schemaId;

        this.options.mail = options.mail;


        this.options.appCredential = options.appCredential;
        this.developerDashboardVerifyApi = `${sanetizeUrl(options.developerDashboardUrl)}/hs/api/v2/subscription/verify`;
        this.mailService = this.options.mail && Object.keys(this.options.mail).length > 0 ? new MailService({ ...this.options.mail }) : null;
        this.apiAuthToken = "";
        this.isSubscriptionSuccess = false;
        this.isSubcriptionEnabled = options.isSubcriptionEnabled;

        this.verifyResourcePath = this.options.appCredential.credentialSubject.verifyResourcePath != "" ?
            (this.options.appCredential.credentialSubject.verifyResourcePath.startsWith("/") ? this.options.appCredential.credentialSubject.verifyResourcePath : "/" + this.options.appCredential.verifyResourcePath) :
            "/hs/api/v2/credential";
    }


    async init() {
        const constructorParams = {
            offlineSigner: this.options.offlineSigner,
            nodeRestEndpoint: this.options.hidNodeRestURL,
            nodeRpcEndpoint: this.options.hidNodeURL,
            namespace: this.options.namespace,
        };

        const hsSdk = new HypersignSSISdk(constructorParams);
        await hsSdk.init();
        this.hsSdkVC = hsSdk.vc;
        this.hsSDKVP = hsSdk.vp;
    }

    /**
     * Verifies VP
     * @param { Object } vpObj  // verifiable presentation
     * @param { String } challenge  // challenge
     * @returns boolean 
     */
    async verifyPresentation(vpObj, challenge, holderDidDocSigned, domain = 'https://localhos:20202') {
        if (!vpObj) throw new Error('presentation is null')
        if (!challenge) throw new Error('challenge is null')

        const vc = vpObj.verifiableCredential[0];
        let options
        if (holderDidDocSigned) {
            const holderDidDocSignedtemp = JSON.parse(holderDidDocSigned)
            options = {
                signedPresentation: vpObj,
                challenge,
                domain,
                issuerDid: vc.issuer,
                holderDidDocSigned: holderDidDocSignedtemp,
                holderVerificationMethodId: vpObj.proof.verificationMethod,
                issuerVerificationMethodId: vc.proof.verificationMethod
            }
        } else {
            options = {
                signedPresentation: vpObj,
                challenge,
                domain,
                issuerDid: vc.issuer,
                holderDid: vc.credentialSubject.id,
                holderVerificationMethodId: vpObj.proof.verificationMethod,
                issuerVerificationMethodId: vc.proof.verificationMethod
            }
        }
        const result = await this.hsSDKVP.verify(options)
        const { verified } = result;
        return verified;
    }

    /**
     * Generates verfiable credentials based on userdata 
     * @param { Object } userData 
     * @returns signed VC
     */
    async generateCredential(userData, expirationDate, didDoc) {
        // const schemaUrl = this.options.hidNodeURL + '/api/v1/schema/' + this.options.schemaId;
        const schemaId = this.options.schemaId;
        const issuerKeys = this.options.keys;
        const { did } = userData;

        // removing unwanted fields since they got added by JWT
        delete userData['iat'];
        delete userData['exp'];
        delete userData['did'];

        logger.debug("HS-AUTH:: Credential is being generated...")
        let options = {}
        if (didDoc) {
            options = {
                schemaId,
                subjectDidDocSigned: didDoc,
                issuerDid: issuerKeys.publicKey.id,
                expirationDate,
                fields: userData
            }
        } else {
            options = {
                schemaId,
                subjectDid: did,
                issuerDid: issuerKeys.publicKey.id,
                expirationDate,
                fields: userData
            }
        }
        const credential = await this.hsSdkVC.generate(options)
        logger.debug("HS-AUTH:: Credential is being signed...")
        const verificationMethodId = issuerKeys.publicKey.id + "#key-1";
        const signOptions = {
            credential,
            issuerDid: issuerKeys.publicKey.id,
            privateKeyMultibase: issuerKeys.privateKeyMultibase,
            verificationMethodId,
            registerCredential: false,
        }
        const signedCredential = await this.hsSdkVC.issue(signOptions)
        const txn_message = await this.hsSdkVC.generateRegisterCredentialStatusTxnMessage(signedCredential.credentialStatus, signedCredential.credentialStatusProof)
        signedCredential['txn'] = txn_message
        return signedCredential
    }

    /**
     * Generates verifiable presentation
     * @returns signed VP
     */
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

    /**
     * Calls subscription api to check for plan and subscription
     */
    async callSubscriptionAPIwithPresentation() {
        const data = await this.generatePresentation();
        const json = await fetchData(this.developerDashboardVerifyApi, {
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
            throw new Error('HS-AUTH-NODE-SDK::Error:' + json.error);
        }
    }

    /**
     * Check for subscription
     */
    async checkSubscription() {
        if (this.apiAuthToken == "") {
            logger.debug('HS-AUTH:: No API Authorization token found, authenticating using verifiable presentation');
            await this.callSubscriptionAPIwithPresentation();
        } else {
            logger.debug('HS-AUTH:: Found API Authorization token, trying to authorize');
            const developerPortalAPI = `${this.developerDashboardVerifyApi}?apiAuthToken=${this.apiAuthToken}`;
            const json = await fetchData(developerPortalAPI, {
                method: 'POST',
            });

            if (json.status == 200) {
                this.isSubscriptionSuccess = true;
            } else if (json.status == 403) {
                logger.debug('HS-AUTH:: API Authorization token has expired. Trying to authentication again using verifiable presentation');
                await this.callSubscriptionAPIwithPresentation();
            } else {
                throw new Error('HS-AUTH-NODE-SDK::Error:' + json.error);
            }
        }
    }

    /**
     * Verifies refreshtoken JWT
     * @param { String } refreshToken 
     * @returns payload
     */
    async verifyRefreshToken(refreshToken) {
        return await jwt.verify(refreshToken, this.options.rftokenSecret)
    }

    // Public methods
    /////////////////

    /**
     * Authenticates user's credentials
     * @param { object } body 
     * @returns accessToken and refreshToken
     */
    async authenticate(body, appUserID = '') {
        const { challenge, vp, holderDidDocSigned } = body;
        if (this.isSubcriptionEnabled) {
            await this.checkSubscription();
            if (!this.isSubscriptionSuccess) throw new Error('Subscription check unsuccessfull')
        }

        const vpObj = JSON.parse(vp);
        const subject = vpObj['verifiableCredential'][0]['credentialSubject'];

        logger.debug("HS-AUTH:: Presentation is being verified...")

        if (!(await this.verifyPresentation(vpObj, challenge, holderDidDocSigned))) throw new Error('Could not verify the presentation')


        if (appUserID && appUserID != '') {
            subject['appUserID'] = appUserID;
        }

        // TODO:  need to find out if we are missing any imp parameter in the options.
        // what is the proper way to JWT sign 
        const accessToken = await jwt.sign(subject, this.options.jwtSecret, { expiresIn: this.options.jwtExpiryTime });
        const refreshToken = await jwt.sign(subject, this.options.rftokenSecret, { expiresIn: this.options.rftokenExpiryTime })

        // TODO:  once we use redis , we can set the expiration time = this.options.rftokenExpiryTime also
        // but for in-mem, let;s keep it simple
        await tokenStore.set(subject.id, refreshToken, this.options.rftokenExpiryTime)

        let client = clientStore.getClient(challenge)
        const tokens = { accessToken, refreshToken }
        if (client.connection) {
            client.connection.sendUTF(getFormatedMessage('end', responseMessageFormat(true, 'User is authenticated', tokens)))
            client = clientStore.updateClient(challenge, client.connection, true, tokens.accessToken, tokens.refreshToken);
            clientStore.deleteClient(client.clientId);
        } else {
            client = clientStore.updateClient(challenge, null, true, tokens.accessToken, tokens.refreshToken);
        }
        logger.debug("HS-AUTH:: Finished.")
        return {
            user: subject,
            ...tokens
        }
    }

    /**
     * Verifies old refresh token and generates a new pair
     * @param { string } refreshToken 
     * @returns accessToken and refreshToken
     */
    async refresh(refreshToken) {
        const payload = await this.verifyRefreshToken(refreshToken)

        // TODO: we need to check if this refresh token was present in the store.
        const refTokenStored = await tokenStore.get(payload.id)

        if (refTokenStored != refreshToken) {
            throw new Error("Invalid ref token or expired")
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

    /**
     * Deletes refresh token for that user
     * @param { string } refreshToken 
     */
    async logout(refreshToken) {
        const payload = await this.verifyRefreshToken(refreshToken)
        // TODO: delete on logout
        await tokenStore.delete(payload.id)
    }

    /**
     * Verifies JWT accessToken
     * @param { string } authToken 
     * @returns payload
     */
    async authorize(authToken) {
        return await jwt.verify(authToken, this.options.jwtSecret)
    }

    /**
     * Geneartes verifiable credential JWT and sends email
     * @param { object } user 
     * @param { boolean } isThridPartyAuth 
     * @returns null
     */
    async register(user, isThridPartyAuth = false, expirationDate, didDoc) {
        if (!this.mailService) throw new Error("Mail configuration is not defined");
        if (!this.verifyResourcePath) throw new Error("VerifyResourcePath is not set in configuration file")

        if (!user) throw new Error("User object is null or empty.")

        if (isThridPartyAuth) {
            const { did } = user;

            if (!did) throw new Error("Did must be passed with thirdparty auth request");

            const verifiableCredential = await this.generateCredential(user, expirationDate, didDoc);
            return verifiableCredential;
        }

        const token = await jwt.sign(user, this.options.jwtSecret, { expiresIn: this.options.jwtExpiryTime })
        let link = `${this.baseUrl}${this.verifyResourcePath}?token=${token}`;
        let mailTemplate = regMailTemplate;
        mailTemplate = mailTemplate.replace(/@@APPNAME@@/g, this.options.mail.name);
        mailTemplate = mailTemplate.replace('@@RECEIVERNAME@@', user.name);
        mailTemplate = mailTemplate.replace('@@LINK@@', link);
        const JSONdata = JSON.stringify({
            QRType: 'ISSUE_CRED',
            url: link
        });

        // TODO:  need to remove this hardcoded url
        const authServerOrigin = (new URL(this.options.hidNodeURL)).origin;
        const authenticationServerEndPoint = `${authServerOrigin}/hsauth`
        const deepLinkUrl = encodeURI(`${authenticationServerEndPoint}/deeplink.html?deeplink=hypersign:deeplink?url=${JSONdata}`);
        mailTemplate = mailTemplate.replace("@@DEEPLINKURL@@", deepLinkUrl);

        if (!user.email) throw new Error("No email is passed. Email is required property");
        const info = await this.mailService.sendEmail(user.email, mailTemplate, `${this.options.mail.name} Auth Credential Issuance`);
        return null;
    }

    /**
     * Verifies VC JWT and Geneartes verifiable credential
     * @param { string } token 
     * @param { string } userDid 
     * @returns verifiable credential
     */
    async getCredential(token, userDid) {
        const data = await jwt.verify(token, this.options.jwtSecret)
        data.did = userDid;
        const verifiableCredential = await this.generateCredential(data);
        return verifiableCredential
    }

    async poll({ challenge }) {
        if (!challenge) {
            throw new Error("Challenge must be passed");
        }
        let client = clientStore.getClient(challenge);
        if (!client) {
            throw new Error("Invalid challenge");
        }
        const { isAuthenticated, accessToken, refreshToken } = client;
        if (isAuthenticated === false) {
            throw new Error("Unauthorized");
        }

        clientStore.deleteClient(challenge);
        return { accessToken, refreshToken };
    }
}