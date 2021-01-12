const express = require("express");
// const session = require("express-session");
// const cookieParser = require("cookie-parser");
const cors = require("cors");
const csrf = require("csurf");
const jwt = require("express-jwt");
const jwks = require("jwks-rsa");
require("dotenv").config();

const { PORT = 3001 } = process.env;
const products = require("./modules/products.js");
const users = require("./modules/users.js");

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
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, _csrf",
  credentials: true,
  origin: "http://localhost:3000",
};

// const csrfProtection = csrf({ cookie: true });

const app = express();
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: process.env.NODE_ENV === "production" },
//   })
// );
app.use(express.json());
// app.use(cookieParser());
// app.use(csrfProtection);

// app.use(cors({ ...corsOptions }));
// app.use(function (req, res, next) {
//   // res.header("Access-Control-Allow-Origin", process.env.FRONTEND_APP_URL);
//   res.header("Access-Control-Allow-Origin", "*");
//   // res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//   );
//   next();
// });

app.use((req, res, next) => {
  res.format({
    "application/json": () => next(),
    default: () => res.status(406).end(),
  });
});

app.param("userId", (req, res, next, id) => {
  if (!isNaN(id) && !isNaN(parseInt(id))) {
    req.userId = id;
    next();
  } else {
    next(new Error("ID is not a number"));
  }
});

app.param("prodId", (req, res, next, id) => {
  if (!isNaN(id) && !isNaN(parseInt(id))) {
    req.prodId = id;
    next();
  } else {
    next(new Error("ID is not a number"));
  }
});

//
app.options("/", cors({ ...corsOptions, methods: "GET, OPTIONS" }));
app.get("/", (req, res) => res.send("Ewaja backend"));
// app.all("/*", cors(corsOptions));
app.all("/", (req, res) => res.status(405).end());

/* ------------------------
    INJECTING CSRF TOKEN
------------------------ */
const withCsrfToken = (req, response) => ({
  csrfToken: req.csrfToken(),
  ...response,
});

/* ------------------------
        MIDDLEWARE
------------------------ */
const getUserID = (req, res, next) => {
  if (req.user) {
    users.getUserID(req.user).then((user_id) => {
      req.caller_id = user_id;
      next();
    });
  } else {
    res.status(403).end();
  }
};

const ownUser = (req, res, next) => {
  if (req.userId && req.userId === req.caller_id) {
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
      .catch((err) => res.status(403).end());
  } else {
    res.status(403).end();
  }
};

const isOwnUserOrAdmin = (req, res, next) => {
  req.isAdmin = false;
  if (req.userId) {
    if (req.userId === req.caller_id) {
      req.isAdmin = true;
      next();
    } else {
      users.isAdmin(req.caller_id).then((isAdmin) => {
        req.isAdmin = isAdmin;
        next();
      });
    }
  } else if (req.prodId) {
    products
      .getUser(req.prodId)
      .then((product_user_id) => {
        req.isAdmin = product_user_id === req.caller_id;
        next();
      })
      .catch(() => res.status(404).end());
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
app.options("/users", cors({ ...corsOptions, methods: "POST, OPTIONS" }));

app.post(
  "/users",
  cors({ ...corsOptions, exposedHeaders: "Location" }),
  validateJwt,
  (req, res) => {
    users
      .store(req.user, req.body)
      .then((result) => res.status(201).location(`/users/${result}`).send())
      .catch((err) => res.send(err));
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
      .then((result) => res.end())
      .catch((err) => res.status(500).end());
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
      .then((result) => res.end())
      .catch((err) => res.status(500).end());
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
          .catch((err) => res.send(err))
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

app.get(
  "/products/:prodId",
  cors(corsOptions),
  /*csrfProtection,*/ (req, res) => {
    products
      .one(req.prodId)
      .then((result) => res.send(result))
      .catch((err) => res.status(404).end());
  }
);

app.put(
  "/products/:prodId",
  cors(corsOptions),
  // csrfProtection,
  validateJwt,
  getUserID,
  ownUser,
  (req, res) => {
    products
      .update(req.body, req.prodId)
      .then((result) => res.status(200).end())
      .catch((err) => res.status(404).end());
  }
);

app.delete(
  "/products/:prodId",
  cors(corsOptions),
  validateJwt,
  getUserID,
  isOwnUserOrAdmin,
  (req, res) => {
    req.isAdmin
      ? products
          .destroy(req.prodId)
          .then((result) => res.end())
          .catch((err) => res.status(404).end())
      : res.status(403).end();
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
