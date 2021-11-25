const http = require("http");
const express = require("express");
const cors = require("cors");
const path = require("path");
const HypersignAuth = require("hypersign-auth-js-sdk");

const port = 4006;
const app = express();
const server = http.createServer(app);

const TIME = () => new Date();
app.use(express.json());
app.use(cors());

const hypersign = new HypersignAuth(server);

// Unprotected resource, may be to show login page
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname + "/public/index.html"));
});

// Authenticates a user
// Doc: https://github.com/hypersign-protocol/hypersign-auth-js-sdk/blob/master/docs.md#hypersignauthenticate
app.post(
  "/hs/api/v2/auth",
  hypersign.authenticate.bind(hypersign),
  (req, res) => {
    try {
      const { user, accessToken, refreshToken } = req.body.hypersign.data;
      console.log(user);
      // Do something with the user data.
      // The hsUserData contains userdata and authorizationToken
      res.status(200).send("Authenticated");
    } catch (e) {
      res.status(500).send();
    }
  }
);

// New session
// Doc: https://github.com/hypersign-protocol/hypersign-auth-js-sdk/blob/master/docs.md#hypersignchallenge
app.post("/challenge", hypersign.challenge.bind(hypersign), (req, res) => {
  res.status(200).send(req.body);
});

// Polling if authentication finished
// Doc: https://github.com/hypersign-protocol/hypersign-auth-js-sdk/blob/master/docs.md#hypersignpoll
app.get("/poll", hypersign.poll.bind(hypersign), (req, res) => {
  res.status(200).send(req.body);
});

// Authorizes a user and gives access to resource
// Doc: https://github.com/hypersign-protocol/hypersign-auth-js-sdk/blob/master/docs.md#hypersignauthorize
app.post("/protected", hypersign.authorize.bind(hypersign), (req, res) => {
  try {
    const user = req.body.hypersign.data;
    console.log(user);
    // Do whatever you want to do with it
    res.status(200).send({ status: 200, message: user, error: null });
  } catch (e) {
    res.status(500).send(e.message);
  }
});


server.listen(port, () => {
  console.log(`${TIME()} The server is running on port : ${port}`);
});
