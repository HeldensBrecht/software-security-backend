const express = require("express");
const jwt = require("express-jwt");
const jwks = require("jwks-rsa");

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
  issuer: `https://${process.env.AUTH0_DOMAIN}`,

  algorithms: ["RS256"],
});

const app = express();
const { PORT = 3001 } = process.env;

app.get("/", (req, res) => res.send("Ewaja backend"));

app.listen(PORT, () =>
  console.log(`Ewaja backend app listening on at http://localhost:${PORT}`)
);
