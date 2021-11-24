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


app.post("/challenge", hypersign.challenge.bind(hypersign), (req, res) => {
  res.status(200).send(req.body);
});

app.get("/poll", hypersign.poll.bind(hypersign), (req, res) => {
  res.status(200).send(req.body);
});

// Protected resource
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
