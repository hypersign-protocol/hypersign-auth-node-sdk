# Hypersign Decentralised Authentication (Hypersign dAuth) Node SDK

Hypersign is identity and access management infrastructure that ensures your employess and customers are really who they say they are. By combining biometric with the blockchain, it offers passwordless authentication, authorization, verification and intergrates in minutes.

Hypersign-auth-node-sdk is node js based SDK for backend to implement passwordless authentication. This SDK uses Websocket/Polling to communicate with client. 

<a href="https://www.producthunt.com/posts/hypersign-1?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-hypersign-1" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=276083&theme=light" alt="Hypersign - An identity and access sol'n that protects user's privacy | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>

## Watch the demo on Youtube

> Note: this is old video - will update the new one soon!

[![IMAGE ALT TEXT](http://i.imgur.com/FWVjPfu.png)](https://www.youtube.com/watch?v=pSCmCZfeQKo&feature=youtu.be "hypersign developer exp")  

## The protocol

![img](demo/public/protocol2.png)

For more detials about Hypersign protocol, read the [developer documentation](https://docs.hypersign.id/dauth/introduction) or read our whitepaper at our [website](https://hypersign.id).

## Installation

```
npm i hypersign-auth-node-sdk --save
```

## Intergrate Hypersign Auth with Nodejs Application

To successfully intergrate Hypersign we need to do the following:

1. The app developer intergrates the Hypersign auth sdk with their nodejs backed
2. The app developer implement code to show QR code on the login page
3. Now the user will download [Hypersign Identity Mobile wallet]() and register himself. Upon registration, he will get HypersignAuth Credenital which he can use to login to websites which supports Hypersign login.


### Pre-requisite 

You must have `hypersign.json` file in root directory of your project. To generate `hypersign.json` file, please visit our [developer dashboard](https://dashboard.hypersign.id).

### Server Side

Import the package 

```js
const HypersignAuth = require('hypersign-auth-node-sdk')
```

Create the server

```js
const app = express()
const server = http.createServer(app)
```

Initialise Hypersign instance

```js
const hypersign = new HypersignAuth(server);
```

Expose `/hs/api/v2/auth` API and and use `hypersign.authenticate` middleware.

```js
// Implement /hs/api/v2/auth API 
app.post('/hs/api/v2/auth', hypersign.authenticate.bind(hypersign), (req, res) => {
    try {
        const { user } = req.body.hypersign.data;
        // Do something with the user data.
        res.status(200).send({ status: 200, message: "Success", error: null });
    } catch (e) {
        res.status(500).send({ status: 500, message: null, error: e.message });
    }
})
```

Now protect your resources using `hypersign.authorize` middlerware. Take a look at the example;

```js
app.get('/protected', hypersign.authorize.bind(hypersign), (req, res) => {
    try {
        const user = req.body.hypersign.data;
        // Do whatever you want to do with it
        res.status(200).send("I am protected by secure Hypersign authentication");
    } catch (e) {
        res.status(500).send(e.message)
    }
})
```
Make sure to pass send `accessToken` token as bearer authorization token in header when making the protected resource call.

### Client Side

For client side implementation kindly visit [`hypersign-auth-js-sdk`](https://github.com/hypersign-protocol/hypersign-auth-js-sdk) documentation.

## Methods 

1. `hypersign.authenticate()`
2. `hypersign.refresh`
3. `hypersign.logout()`
4. `hypersign.challenge()`
5. `hypersign.poll()`
6. `hypersign.register()`
7. `hypersign.issueCredential()`
8. `hypersign.authorize()`


Read more about these [here](/docs.md)


## Demo

Checkout the demo [here](/demo/README.md)

