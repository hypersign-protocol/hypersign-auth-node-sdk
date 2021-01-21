const HSWebsocket = require('./hsWebsocket');
const HSMiddlewareService = require('./hsMiddlewareService');
const fs = require('fs');
const path = require('path');

const HYPERSIGN_CONFIG_FILE = 'hypersign.json'
module.exports = class HypersignAuth {

    constructor({ server, baseUrl, options }) {
        ////
        // Making it backward compatible
        const hsFilePath = path.join(__dirname, '../../', '/', HYPERSIGN_CONFIG_FILE);
        if (fs.existsSync(hsFilePath)) {
            const hypersignConfig = fs.readFileSync(HYPERSIGN_CONFIG_FILE);
            const hsConfigJson = JSON.parse(hypersignConfig);
            Object.assign(options, hsConfigJson);
            // throw new Error(HYPERSIGN_CONFIG_FILE + ' file does not exist. Generate ' + HYPERSIGN_CONFIG_FILE + ' file from the dashboard.');
        }

        console.log(options);
        const ws = new HSWebsocket(server, baseUrl);
        ws.initiate();
        this.middlewareService = new HSMiddlewareService(options, baseUrl);
    }

    async authenticate(req, res, next) {
        try {
            req.body.hsUserData = await this.middlewareService.authenticate(req.body);
            next();
        } catch (e) {
            console.log(e)
            res.status(401).send(e.message);
        }
    }

    extractToken(req) {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            return req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.token) {
            return req.query.token;
        }
        return null;
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
            console.log(req.body);
            if (!req.body) throw new Error('User data is not passed in the body: req.body.userData')
            await this.middlewareService.register(req.body);
            next();
        } catch (e) {
            console.log(e)
            res.status(403).send(e.message);
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
            res.status(403).send(e.message);
        }
    }

}