const http = require('http')
const express = require('express')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const HypersignAuth = require('hypersign-auth-js-sdk')

const port = 4006
const app = express()
const server = http.createServer(app)

const TIME = () => new Date();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser());
app.use(express.static('public'))


const options = {
    jwtSecret: process.env.JWTSECRET || 'vErySecureSec8@#',
    jwtExpiryTime: process.env.JWTEXPTIME || 240000, // in ms
    hsNodeUrl: 'http://localhost:5000',
    hsAppId: 'XXX-XXXX-XXX',
    hsAppSecret: 'XXX-XXXX-XXX'
}
const hypersign = new HypersignAuth({
    server, // http server,
    baseUrl: 'http://localhost:4006',
    options
});

// Unprotected resource, may be to show login page
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + 'index.html'));
});

// Implement /auth API: 
app.post('/hs/api/v2/auth', hypersign.authenticate.bind(hypersign), (req, res) => {
    try {
        const user = req.body.hsUserData;
        // Do something with the user data.
        // The hsUserData contains userdata and authorizationToken
        res.status(200).send({ status: 200, message: "Success", error: null });
    } catch (e) {
        res.status(500).send({ status: 500, message: null, error: e.message });
    }
})

// Protected resource
// Must pass hs_authorizationToken in x-auth-token header
app.get('/protected', hypersign.authorize.bind(hypersign), (req, res) => {
    try {
        const user = req.body.userData;
        // Do whatever you want to do with it
        res.status(200).send("I am protected by secure Hypersign authentication");
    } catch (e) {
        res.status(500).send(e.message)
    }
})

server.listen(port, () => {
    console.log(`${TIME()} The server is running on port : ${port}`)
})