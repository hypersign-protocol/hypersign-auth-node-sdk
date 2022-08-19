const http = require('http')
const express = require('express')
const HIDWallet = require('hid-hd-wallet');
const HypersignAuth = require('hypersign-auth-node-sdk')
const authRoutes = require('./routes')
const mnemonic = "retreat seek south invite fall eager engage endorse inquiry sample salad evidence express actor hidden fence anchor crowd two now convince convince park bag"
const port = 4006
const app = express()
const server = http.createServer(app)
const cors = require('cors');
const TIME = () => new Date();

const whitelistedUrls = ["http://localhost:4999", "*"]

function corsOptionsDelegate(req, callback) {
    let corsOptions;
    if (whitelistedUrls.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
    } else {
        corsOptions = { origin: false } // disable CORS for this request
    }
    callback(null, corsOptions) // callback expects two parameters: error and options
}

app.use(express.json());
app.use(cors(corsOptionsDelegate));
app.use(express.static("public"));


let hypersign;

const walletOptions = {
    hidNodeRPCUrl: 'https://jagrat.hypersign.id/node1/rpc/',
    hidNodeRestUrl: 'https://jagrat.hypersign.id/node1/rest/',
};
const hidWalletInstance = new HIDWallet(walletOptions);
hidWalletInstance.generateWallet({ mnemonic }).then(async() => {
        hypersign = new HypersignAuth(server, hidWalletInstance.offlineSigner)
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