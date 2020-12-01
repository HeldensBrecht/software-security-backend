const express = require("express");
const jwt = require("express-jwt");
const jwks = require("jwks-rsa");
require("dotenv").config();

const products = require("./modules/products.js");

const validateJwt = jwt({
  //Signing key providen + cachen
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  //Validate audience & issuer
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,

  algorithms: ["RS256"],
});

const app = express();
app.use(express.json());
const { PORT = 3001 } = process.env;

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

app.get("/", (req, res) => res.send("Ewaja backend"));

app.get("/private", validateJwt, (req, res) => {
  res.json({
    message: "Hello from PRIVATE",
  });
});

app.get("/products", (req, res) => {
  products
    .get(req.body)
    .then((result) => res.send(result))
    .catch((err) => res.send(err));
});

app.post("/products/one", (req, res) => {
  products
    .one(req.body.id)
    .then((result) => res.send(result))
    .catch((err) => res.send(err));
});

app.post("/products", validateJwt, (req, res) => {
  products
    .store(req.body)
    .then((result) => res.send(result))
    .catch((err) => res.send(err));
});

app.listen(PORT, () =>
  console.log(`Ewaja backend app listening on at http://localhost:${PORT}`)
);
