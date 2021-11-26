const http = require('http')
const express = require('express')
const cors = require('cors');
const path = require('path');
const HypersignAuth = require('hypersign-auth-js-sdk')

const port = 4006
const app = express()
const server = http.createServer(app)

const TIME = () => new Date();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const hypersign = new HypersignAuth(server);

// Render Login page
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

// Render registration page
app.get('/register', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/register.html'));
});

// Implement authentication API
// Doc: https://github.com/hypersign-protocol/hypersign-auth-js-sdk/blob/master/docs.md#hypersignauthenticate
app.post('/hs/api/v2/auth', hypersign.authenticate.bind(hypersign), (req, res) => {
    try {
        const { user } = req.body.hypersign.data;
        console.log(user)
            // Do something with the user data.
            // The hsUserData contains userdata and authorizationToken
        res.status(200).send({ status: 200, message: "Success", error: null });
    } catch (e) {
        res.status(500).send({ status: 500, message: null, error: e.message });
    }
})


// Implement /register API: 
// Analogous to register user but not yet activated
// Doc: https://github.com/hypersign-protocol/hypersign-auth-js-sdk/blob/master/docs.md#hypersignregister
app.post('/hs/api/v2/register', hypersign.register.bind(hypersign), (req, res) => {
    try {
        console.log('Register success');
        // You can store userdata (req.body) but this user is not yet activated since he has not 
        // validated his email.
        res.status(200).send({ status: 200, message: "Success", error: null });
    } catch (e) {
        res.status(500).send({ status: 500, message: null, error: e.message });
    }
})


// Implement /credential API: 
// Analogous to activate user
// Doc: https://github.com/hypersign-protocol/hypersign-auth-js-sdk/blob/master/docs.md#hypersignissuecredential
app.get('/hs/api/v2/credential', hypersign.issueCredential.bind(hypersign), (req, res) => {
    try {
        console.log('Credential success');
        const { hypersign } = req.body;
        const { data } = hypersign;
        console.log(hypersign)
        res.status(200).send({ ...data });
    } catch (e) {
        res.status(500).send({ status: 500, message: null, error: e.message });
    }
})


// Any resource which you want to protect
// Must pass Authorization: Bearer <accessToken>  as header
// Doc: https://github.com/hypersign-protocol/hypersign-auth-js-sdk/blob/master/docs.md#hypersignauthorize
app.post('/protected', hypersign.authorize.bind(hypersign), (req, res) => {
    try {
        const user = req.body.hypersign.data;
        console.log(user)
            // Do whatever you want to do with it
        res.status(200).send({ status: 200, message: user, error: null });
    } catch (e) {
        res.status(500).send(e.message)
    }
})

server.listen(port, () => {
    console.log(`${TIME()} The server is running on port : ${port}`)
})