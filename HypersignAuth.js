const HSWebsocket = require('./hsWebsocket');
const HSMiddlewareService = require('./hsMiddlewareService');

module.exports = class HypersignAuth {

    constructor({ server, baseUrl, options }) {
        console.log(options)
        const ws = new HSWebsocket(server, baseUrl);
        ws.initiate();
        this.middlewareService = new HSMiddlewareService(options);
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

    async authorize(req, res, next) {
        try {
            const authToken = req.headers['x-auth-token'];
            req.body.userData = await this.middlewareService.authorize(authToken);
            next();
        } catch (e) {
            console.log(e)
            res.status(403).send(e.message);
        }
    }

}