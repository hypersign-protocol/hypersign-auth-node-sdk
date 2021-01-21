const jwt = require('jsonwebtoken');
const hsdk = require('lds-sdk');
const regMailTemplate = require('./mail.template');
const MailService = require('./mail.service');
const { clientStore } = require('./config');


module.exports = class HSMiddlewareService {
    constructor(options = {}, baseUrl) {
        this.options = {};
        this.options.jwtExpiryTime = options ? options.jwtExpiryTime : 240000;
        this.options.jwtSecret = options ? options.jwtSecret : 'secretKey';
        this.options.hsNodeUrl = options ? options.hsNodeUrl : 'http://localhost:5000'
        this.options.mail = options ? options.mail : mail;
        this.hsSdkVC = hsdk.credential({ nodeUrl: this.options.hsNodeUrl, didScheme: "did:hs" });
        this.baseUrl = baseUrl;

        this.baseUrl = this.sanetizeUrl(this.baseUrl);
        this.options.hsNodeUrl = this.sanetizeUrl(this.options.hsNodeUrl)

        this.options.keys = options.keys;
        this.options.schemaId = options.schemaId;
        this.options.mail = options.mail;

        this.mailService = this.options.mail ? new MailService({...this.options.mail }) : null;
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

        // TODO: need to do this in better way..more dynamic way.
        // make use of SCHEMA.attributes
        const attributesMap = {
            "Name": userData.name,
            "Email": userData.email
        }

        const credential = await this.hsSdkVC.generateCredential(schemaUrl, {
            subjectDid: userData.did,
            issuerDid: issuerKeys.publicKey.id,
            expirationDate: new Date().toISOString(),
            attributesMap,
        })

        const signedCredential = await this.hsSdkVC.signCredential(credential, issuerKeys.publicKey.id, issuerKeys.privateKeyBase58)
        return signedCredential
    }

    // Public methods
    /////////////////
    async authenticate({ challenge, vp }) {
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
        console.log('After generate DEEPLINKURL =', deepLinkUrl);

        mailTemplate = mailTemplate.replace("@@DEEPLINKURL@@", deepLinkUrl);

        console.log('Before sending the mail');
        const info = await this.mailService.sendEmail(user.email, mailTemplate);
        console.log('Mail is sent info = ', info);
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