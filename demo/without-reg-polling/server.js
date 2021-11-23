const http = require("http");
const express = require("express");
const cors = require("cors");
const path = require("path");
const HypersignAuth = require("hypersign-auth-js-sdk");

const port = 3003;
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

// Implement /auth API:
app.post(
  "/hs/api/v2/auth",
  hypersign.authenticate.bind(hypersign),
  (req, res) => {
    try {
      const user = req.body.hsUserData;
      console.log(user);
      // Do something with the user data.
      // The hsUserData contains userdata and authorizationToken
      res.status(200).send({ status: 200, message: "Success", error: null });
    } catch (e) {
      res.status(500).send({ status: 500, message: null, error: e.message });
    }
  }
);

// Protected resource
// Must pass hs_authorizationToken in x-auth-token header
app.post("/protected", hypersign.authorize.bind(hypersign), (req, res) => {
  try {
    const user = req.body.userData;
    console.log(user);
    // Do whatever you want to do with it
    res.status(200).send({ status: 200, message: user, error: null });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.post("/challenge", hypersign.challenge.bind(hypersign), (req, res) => {
  res.status(200).send(req.body);
});

app.get("/poll", hypersign.poll.bind(hypersign), (req, res) => {
  res.status(200).send(req.body);
});

server.listen(port, () => {
  console.log(`${TIME()} The server is running on port : ${port}`);
});
