const jwt = require('jsonwebtoken');
const hsdk = require('lds-sdk');
const regMailTemplate = require('./mail.template');
const MailService = require('./mail.service');
const { clientStore } = require('./config');
const fetch = require('node-fetch');


module.exports = class HSMiddlewareService {
    constructor(options = {}, baseUrl) {
        this.options = {};
        this.options.jwtExpiryTime = options ? options.jwt.expiryTime : 240000;
        this.options.jwtSecret = options ? options.jwt.secret : 'secretKey';
        this.options.hsNodeUrl = options ? options.networkUrl : 'https://ssi.hypermine.in/core'
        this.options.mail = options ? options.mail : mail;
        this.hsSdkVC = hsdk.credential({ nodeUrl: this.options.hsNodeUrl, didScheme: "did:hs" });
        this.baseUrl = baseUrl;

        this.baseUrl = this.sanetizeUrl(this.baseUrl);
        this.options.hsNodeUrl = this.sanetizeUrl(this.options.hsNodeUrl)

        this.options.keys = options.keys;
        this.options.schemaId = options.schemaId;
        this.options.mail = options.mail;

        this.options.appCredential = options.appCredential;
        this.developerDashboardVerifyApi = `${this.sanetizeUrl(options.developerDashboardUrl)}/hs/api/v2/subscription/verify`;

        this.mailService = this.options.mail ? new MailService({...this.options.mail }) : null;

        this.apiAuthToken = "";
        this.isSubscriptionSuccess = false;
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
        const schemaUrl = this.options.hsNodeUrl + '/api/schema/get/' + this.options.schemaId;
        const issuerKeys = this.options.keys;
        const { did } = userData;

        // removing unwanted fields since they got added by JWT
        delete userData['iat'];
        delete userData['exp'];
        delete userData['did'];

        // TODO:  remove this code later please.... you need to fix this in the core's
        const attributesMap = [];
        Object.keys(userData).forEach((attr, i) => {
            if (i > 0) attributesMap[` ${attr}`] = userData[attr]
            else attributesMap[attr] = userData[attr]
        })

        const credential = await this.hsSdkVC.generateCredential(schemaUrl, {
            subjectDid: did,
            issuerDid: issuerKeys.publicKey.id,
            expirationDate: new Date().toISOString(),
            attributesMap,
        })

        const signedCredential = await this.hsSdkVC.signCredential(credential, issuerKeys.publicKey.id, issuerKeys.privateKeyBase58)
        return signedCredential
    }

    async generatePresentation() {
        const issuerKeys = this.options.keys;
        const presentation = await this.hsSdkVC.generatePresentation(
            this.options.appCredential,
            issuerKeys.publicKey.id
        );
        const challenge = hsdk.did().getChallange();
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
            console.log('No API Authorization token found, authenticating using verifiable presentation');
            await this.callSubscriptionAPIwithPresentation();
        } else {
            console.log('Found API Authorization token, trying to authorize');
            const developerPortalAPI = `${this.developerDashboardVerifyApi}?apiAuthToken=${this.apiAuthToken}`;
            const json = await this.fetchData(developerPortalAPI, {
                method: 'POST',
            });

            if (json.status == 200) {
                this.isSubscriptionSuccess = true;
            } else if (json.status == 403) {
                console.log('API Authorization token has expired. Trying to authentication again using verifiable presentation');
                await this.callSubscriptionAPIwithPresentation();
            } else {
                throw new Error(json.error);
            }
        }
    }

    // Public methods
    /////////////////
    async authenticate({ challenge, vp }) {
        await this.checkSubscription();
        if (!this.isSubscriptionSuccess) throw new Error('Subscription check unsuccessfull')
        const vpObj = JSON.parse(vp);
        const subject = vpObj['verifiableCredential'][0]['credentialSubject'];
        if (!(await this.verifyPresentation(vpObj, challenge))) throw new Error('Could not verify the presentation')
        const token = await jwt.sign(subject, this.options.jwtSecret, { expiresIn: this.options.jwtExpiryTime });
        const client = clientStore.getClient(challenge)
        client.connection.sendUTF(this.getFormatedMessage('end', { message: 'User is validated. Go to home page.', token }))
        clientStore.deleteClient(client.clientId);
        return {
            hs_userdata: subject,
            hs_authorizationToken: token
        }
    }

    async authorize(authToken) {
        return await jwt.verify(authToken, this.options.jwtSecret)
    }


    async register(user) {
        const token = await jwt.sign(user, this.options.jwtSecret, { expiresIn: this.options.jwtExpiryTime })
        let link = `${this.baseUrl}/hs/api/v2/credential?token=${token}`;
        let mailTemplate = regMailTemplate;
        mailTemplate = mailTemplate.replace(/@@APPNAME@@/g, 'Demo App');
        mailTemplate = mailTemplate.replace('@@RECEIVERNAME@@', user.name);
        mailTemplate = mailTemplate.replace('@@LINK@@', link);
        const deepLinkUrl = 'https://ssi.hypermine.in/hsauth/deeplink.html?deeplink=superhero:credential?url=' + link;
        mailTemplate = mailTemplate.replace("@@DEEPLINKURL@@", deepLinkUrl);
        const info = await this.mailService.sendEmail(user.email, mailTemplate);
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