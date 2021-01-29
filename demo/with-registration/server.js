const http = require('http')
const express = require('express')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const HypersignAuth = require('hypersign-auth-js-sdk')

const port = 4000
const app = express()
const server = http.createServer(app)

const TIME = () => new Date();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser());


const hypersign = new HypersignAuth(server);

// Unprotected resource, may be to show login page
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

app.get('/register', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/register.html'));
});

// Implement /auth API: 
app.post('/hs/api/v2/auth', hypersign.authenticate.bind(hypersign), (req, res) => {
    try {
        const user = req.body.hsUserData;
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
app.get('/hs/api/v2/credential', hypersign.issueCredential.bind(hypersign), (req, res) => {
    try {
        console.log('Credential success');
        // Now you can make this user active
        res.status(200).send({ status: 200, message: req.body.verifiableCredential, error: null });
    } catch (e) {
        res.status(500).send({ status: 500, message: null, error: e.message });
    }
})


// Protected resource
// Must pass hs_authorizationToken in x-auth-token header
app.post('/protected', hypersign.authorize.bind(hypersign), (req, res) => {
    try {
        const user = req.body.userData;
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