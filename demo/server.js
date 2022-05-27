const http = require('http')
const express = require('express')
const { createHIDWallet } = require('hypersign-wallet-sdk');
const HypersignAuth = require('hypersign-auth-node-sdk')
const authRoutes = require('./routes')
const mnemonic = "retreat seek south invite fall eager engage endorse inquiry sample salad evidence express actor hidden fence anchor crowd two now convince convince park bag"
const port = 4006
const app = express()
const server = http.createServer(app)

const TIME = () => new Date();
app.use(express.json());
app.use(express.static("public"));


let hypersign;
createHIDWallet(mnemonic).then(async(offlineSigner) => {
        const accounts = await offlineSigner.getAccounts();
        console.log('Hid Wallet Initialized hidAddess  = ' + accounts[0].address)
        hypersign = new HypersignAuth(server, offlineSigner)
        console.log(hypersign.authenticate)
        await hypersign.init();
        console.log('Hypersign Auth service has been initialized')

        // Render Login page
        app.get("/", (req, res) => {
            res.sendFile("index.html");
        });

        app.use(authRoutes(hypersign))

    })
    .catch(e => {
        console.error(e)
    })

server.listen(port, () => {
    console.log(`${TIME()} The server is running on port : ${port}`)
})