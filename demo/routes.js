const { Router } = require("express");

const authRoutes = (hypersign) => {
    const router = Router();
    // Implement authentication API
    // Doc: https://github.com/hypersign-protocol/hypersign-auth-js-sdk/blob/master/docs.md#hypersignauthenticate
    router.post('/hs/api/v2/auth', hypersign.authenticate.bind(hypersign), (req, res) => {
        try {
            const { user } = req.body.hypersign.data;
            console.log(req.body.hypersign.data)
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
    router.post('/hs/api/v2/register', hypersign.register.bind(hypersign), (req, res) => {
        try {

            console.log('Register success');
            // You can store userdata (req.body) but this user is not yet activated since he has not 
            // validated his email.
            res.status(200).send({ status: 200, message: req.body.hypersign.data, error: null });
        } catch (e) {
            res.status(500).send({ status: 500, message: null, error: e.message });
        }
    })

    // Implement /credential API: 
    // Analogous to activate user
    // Doc: https://github.com/hypersign-protocol/hypersign-auth-js-sdk/blob/master/docs.md#hypersignissuecredential
    router.get('/hs/api/v2/credential', hypersign.issueCredential.bind(hypersign), (req, res) => {
        try {
            console.log('Credential success');
            const { hypersign } = req.body;
            const { data } = hypersign;
            console.log(hypersign)
            res.status(200).send({...data });
        } catch (e) {
            res.status(500).send({ status: 500, message: null, error: e.message });
        }
    })

    // Any resource which you want to protect
    // Must pass Authorization: Bearer <accessToken>  as header
    // Doc: https://github.com/hypersign-protocol/hypersign-auth-js-sdk/blob/master/docs.md#hypersignauthorize
    router.post('/protected', hypersign.authorize.bind(hypersign), (req, res) => {
        try {
            const user = req.body.hypersign.data;
            console.log(user)
                // Do whatever you want to do with it
            res.status(200).send({ status: 200, message: user, error: null });
        } catch (e) {
            res.status(500).send(e.message)
        }
    })

    // New session
    // Doc: https://github.com/hypersign-protocol/hypersign-auth-js-sdk/blob/master/docs.md#hypersignchallenge
    router.post("/challenge", hypersign.challenge.bind(hypersign), (req, res) => {
        res.status(200).send(req.body);
    });

    // Polling if authentication finished
    // Doc: https://github.com/hypersign-protocol/hypersign-auth-js-sdk/blob/master/docs.md#hypersignpoll
    router.get("/poll", hypersign.poll.bind(hypersign), (req, res) => {
        res.status(200).send(req.body);
    });

    return router;
}

module.exports = authRoutes