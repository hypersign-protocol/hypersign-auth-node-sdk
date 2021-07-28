const http = require('http')
const https = require('https')
const express = require('express')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const HypersignAuth = require('hypersign-auth-js-sdk');
/////
const httpsLocalhost = require("https-localhost")();

// Ref: https://github.com/daquinoaldo/https-localhost#use-as-module


// https certificate
httpsLocalhost.getCerts().then(cert => {
    const port = 3003
    const app = express();
    const server = https.createServer(cert, app)
    // const server = http.createServer(app)


    

    const TIME = () => new Date();
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(cors());
    app.use(cookieParser());

    app.use(express.static('public'))
    
    const hypersign = new HypersignAuth(server);
    
    // Unprotected resource, may be to show login page
    app.get('/', function(req, res) {
        res.sendFile(path.join(__dirname + '/public/index.html'));
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

    app.get('/test',function(req,res){
        // res.json({"message": "success"});
        // res.redirect('https://localhost:3003/home.html');
      });
    
    
    

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
    
    app.post('/challenge', hypersign.newSession.bind(hypersign), (req, res) => {
        res.status(200).send(req.body);
    })
    
    server.listen(port, () => {
        console.log(`${TIME()} The server is running on port : ${port}`)
    })
}).catch(e => {
    console.log(e)
})
