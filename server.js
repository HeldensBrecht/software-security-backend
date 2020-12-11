const express = require("express");
const jwt = require("express-jwt");
const jwks = require("jwks-rsa");
require("dotenv").config();

const { PORT = 3001 } = process.env;
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

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_APP_URL);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

app.param("prodId", (req, res, next, id) => {
  if (!isNaN(id) && !isNaN(parseInt(id))) {
    req.id = id;
    next();
  } else {
    next(new Error("ID is not a number"));
  }
});

//
app.get("/", (req, res) => res.send("Ewaja backend"));

//test private route
app.get("/private", validateJwt, (req, res) => {
  res.json({
    message: "Hello from PRIVATE",
  });
});

/* ------------------------
        PRODUCTS
------------------------ */
app.get("/products", (req, res) => {
  products
    .get(req.query)
    .then((result) => res.send(result))
    .catch((err) => res.send(err));
});

app.get("/products/:prodId", (req, res) => {
  products
    .one(req.id)
    .then((result) => res.send(result))
    .catch((err) => res.send(err));
});

app.post("/products", validateJwt, (req, res) => {
  products
    .store(req.body)
    .then((result) => res.send(result))
    .catch((err) => res.send(err));
});

app.put("/products/:prodId", validateJwt, (req, res) => {
  products
    .update(req.body, req.id)
    .then((result) => res.send(result))
    .catch((err) => res.send(err));
});

app.delete("/products/:prodId", validateJwt, (req, res) => {
  products
    .destroy(req.id)
    .then((result) => res.send(result))
    .catch((err) => res.send(err));
});

app.listen(PORT, () =>
  console.log(`Ewaja backend app listening on at http://localhost:${PORT}`)
);
