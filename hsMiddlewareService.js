const jwt = require('jsonwebtoken');
const hsdk = require('lds-sdk');
const { clientStore } = require('./config')


module.exports = class HSMiddlewareService {
    constructor(options = {}) {
        this.options = {};
        this.options.jwtExpiryTime = options ? options.jwtExpiryTime : 240000;
        this.options.jwtSecret = options ? options.jwtSecret : 'secretKey';
        this.options.hsNodeUrl = options ? options.hsNodeUrl : 'http://localhost:5000'
        this.hsSdkVC = hsdk.credential({ nodeUrl: this.options.hsNodeUrl, didScheme: "did:hs" });
    }

    async verifyVP(vpObj, challenge) {
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

    // Public methods
    /////////////////
    async authenticate({ challenge, vp }) {
        const vpObj = JSON.parse(vp);
        const subject = vpObj['verifiableCredential'][0]['credentialSubject'];
        if (!(await this.verifyVP(vpObj, challenge))) throw new Error('Could not verify the presentation')
        console.log('Presentation is verified successfully')
        const token = await jwt.sign(subject, this.options.jwtSecret, { expiresIn: this.options.jwtExpiryTime });
        console.log('Token is created, token = ', token)
        const client = clientStore.getClient(challenge)
        console.log('Client fetched, clientID = ', client.clientId)
        console.log('Notifiying the browser')
        client.connection.sendUTF(this.getFormatedMessage('end', { message: 'User is validated. Go to home page.', userdata: token }))
        clientStore.deleteClient(client.clientId);
        return {
            hs_userdata: subject,
            hs_authorizationToken: token
        }
    }

    async authorize(authToken) {
        if (!authToken) throw new Error('Please send the x-auth-token in the header')
        return await jwt.verify(authToken, this.options.jwtSecret)
    }

    getFormatedMessage(op, data) {
        return JSON.stringify({
            op,
            data
        })
    }


}