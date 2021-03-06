const express = require("express");
const cors = require("cors");
const jwt = require("express-jwt");
const jwks = require("jwks-rsa");
require("dotenv").config();

const { PORT = 3001 } = process.env;

const products = require("./modules/products.js");
const users = require("./modules/users.js");
const auth0 = require("./modules/auth0.js");

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

const corsOptions = {
  allowedHeaders:
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, CSRF-Token, X-CSRF-Token",
  credentials: true,
  // origin: process.env.FRONTEND_APP_URL,
};

const app = express();
app.use(express.json());

// app.use(cors({ ...corsOptions }));

app.use((req, res, next) => {
  res.format({
    "application/json": () => next(),
    default: () => res.status(406).end(),
  });
});

/* ------------------------
  RETRIEVING PARAMS
------------------------ */
app.param("userId", (req, res, next, id) => {
  if (!isNaN(id) && !isNaN(parseInt(id))) {
    req.userId = id;
    next();
  } else {
    res.status(400).end();
  }
});

app.param("prodId", (req, res, next, id) => {
  if (!isNaN(id) && !isNaN(parseInt(id))) {
    req.prodId = id;
    next();
  } else {
    res.status(400).end();
  }
});

/* ------------------------
        MIDDLEWARE
------------------------ */
const getUserID = (req, res, next) => {
  if (req.user) {
    users
      .getUserID(req.user)
      .then((user_id) => {
        req.caller_id = user_id;
        next();
      })
      .catch((err) => res.status(401).end());
  } else {
    res.status(401).end();
  }
};

const ownUser = (req, res, next) => {
  if (req.userId && req.userId == req.caller_id) {
    next();
  } else if (req.prodId) {
    products
      .getUser(req.prodId)
      .then((owner_id) => {
        if (owner_id === req.caller_id) {
          next();
        } else {
          res.status(403).end();
        }
      })
      .catch((err) => res.status(404).end());
  } else {
    res.status(500).end();
  }
};

const isOwnUserOrAdmin = (req, res, next) => {
  if (req.prodId) {
    users.isAdmin(req.caller_id).then((isAdmin) => {
      if (isAdmin) {
        next();
      } else {
        products
          .getUser(req.prodId)
          .then((product_user_id) => {
            if (product_user_id === req.caller_id) {
              next();
            } else {
              res.status(403).end();
            }
          })
          .catch(() => res.status(404).end());
      }
    });
  } else {
    res.status(500).end();
  }
};

const isAdmin = (req, res, next) => {
  req.isAdmin = true;
  users.isAdmin(req.caller_id).then((isAdmin) => {
    req.isAdmin = isAdmin;
    next();
  });
};

/* ------------------------
          ROOT
------------------------ */
app.options("/", cors({ ...corsOptions, methods: "GET, OPTIONS" }));

app.get("/", cors(corsOptions), (req, res) => res.send("Ewaja backend"));

app.all("/", (req, res) => res.status(405).end());

/* ------------------------
          USERS
------------------------ */
app.options("/user", cors({ ...corsOptions, methods: "GET, OPTIONS" }));

app.get("/user", cors(corsOptions), validateJwt, (req, res) => {
  users
    .one(undefined, req.user)
    .then((result) => res.send(result))
    .catch((err) => res.status(404).end());
});

app.all("/user", (req, res) => {
  res.set("Allow", "GET, OPTIONS");
  res.status(405).end();
});

//
app.options(
  "/alluserdata/:userId",
  cors({ ...corsOptions, methods: "GET, OPTIONS" })
);

app.get(
  "/alluserdata/:userId",
  cors(corsOptions),
  validateJwt,
  getUserID,
  ownUser,
  (req, res) => {
    users
      .getAllData(req.user)
      .then((internalUserData) => {
        auth0
          .getUser(req.user)
          .then((auth0UserData) =>
            res.send({ ...internalUserData, auth0: auth0UserData })
          )
          .catch((err) =>
            res.send({
              ...internalUserData,
              auth0:
                "An error occured, please contact us for this data section",
            })
          );
      })
      .catch((err) => res.status(404).end());
  }
);

app.all("/alluserdata/:userId", (req, res) => {
  res.set("Allow", "GET, OPTIONS");
  res.status(405).end();
});

//
app.options("/users", cors({ ...corsOptions, methods: "POST, OPTIONS" }));

app.post(
  "/users",
  cors({ ...corsOptions, exposedHeaders: "Location" }),
  validateJwt,
  (req, res) => {
    auth0
      .getUser(req.user)
      .then((auth0User) => {
        users
          .store(req.user, auth0User)
          .then((result) => res.status(201).location(`/users/${result}`).send())
          .catch((err) => res.status(400).end());
      })
      .catch((err) => res.status(400).end());
  }
);

app.all("/users", (req, res) => {
  res.set("Allow", "POST, OPTIONS");
  res.status(405).end();
});

//
app.options(
  "/users/:userId",
  cors({ ...corsOptions, methods: "GET, PUT, DELETE, OPTIONS" })
);

app.get(
  "/users/:userId",
  cors(corsOptions),
  validateJwt,
  getUserID,
  (req, res) => {
    users
      .one(req.userId, req.user, req.caller_id, req.isAdmin)
      .then((result) => res.send(result))
      .catch((err) => res.status(404).end());
  }
);

app.put(
  "/users/:userId",
  cors(corsOptions),
  validateJwt,
  getUserID,
  ownUser,
  (req, res) => {
    users
      .update(req.caller_id, req.body)
      .then((result) => {
        auth0
          .updateUser(req.user, req.body)
          .then((res) => {})
          .catch((err) => console.log(err));
        res.end();
      })
      .catch((err) => res.status(400).end());
  }
);

app.delete(
  "/users/:userId",
  cors(corsOptions),
  validateJwt,
  getUserID,
  ownUser,
  (req, res) => {
    users
      .destroy(req.userId)
      .then((result) => {
        auth0
          .deleteUser(req.user)
          .then(() => res.end())
          .catch((err) => res.status(400).end());
      })
      .catch((err) => res.status(400).end());
  }
);

app.all("/users/:userId", (req, res) => {
  res.set("Allow", "GET, PUT, DELETE, OPTIONS");
  res.status(405).end();
});

/* ------------------------
        PRODUCTS
------------------------ */
app.options(
  "/products",
  cors({ ...corsOptions, methods: "GET, POST, OPTIONS" })
);

app.get("/products", cors(corsOptions), (req, res) => {
  products
    .get(req.query)
    .then((result) => res.send(result))
    .catch((err) => res.send(err));
});

app.post(
  "/products",
  cors({ ...corsOptions, exposedHeaders: "Location" }),
  validateJwt,
  getUserID,
  isAdmin,
  (req, res) => {
    !req.isAdmin
      ? products
          .store(req.body, req.caller_id)
          .then((result) =>
            res.status(201).append("Location", `/products/${result}`).send()
          )
          .catch((err) => res.status(400).end())
      : res.status(403).end();
  }
);

app.all("/products", (req, res) => {
  res.set("Allow", "GET, POST, OPTIONS");
  res.status(405).end();
});

//
app.options(
  "/products/:prodId",
  cors({ ...corsOptions, methods: "GET, PUT, DELETE, OPTIONS" })
);

app.get("/products/:prodId", cors(corsOptions), (req, res) => {
  products
    .one(req.prodId)
    .then((result) => res.send(result))
    .catch((err) => res.status(404).end());
});

app.put(
  "/products/:prodId",
  cors(corsOptions),
  validateJwt,
  getUserID,
  ownUser,
  (req, res) => {
    products
      .update(req.body, req.prodId)
      .then((result) => res.status(200).end())
      .catch((err) => res.status(400).end());
  }
);

app.delete(
  "/products/:prodId",
  cors(corsOptions),
  validateJwt,
  getUserID,
  isOwnUserOrAdmin,
  (req, res) => {
    products
      .destroy(req.prodId)
      .then((result) => res.end())
      .catch((err) => res.status(400).end());
  }
);

app.all("/products/:prodId", (req, res) => {
  res.set("Allow", "GET, PUT, DELETE, OPTIONS");
  res.status(405).end();
});

/*
  Listen
*/
app.listen(PORT, () =>
  console.log(`Ewaja backend app listening on at http://localhost:${PORT}`)
);
