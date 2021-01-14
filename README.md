# software-security-backend

Backend for assignment 2 - Software Security

This is a REST API regarding products for a music store. This music store only sells vinyl and apparel (merch). The service is publically available at https://softwaresec.brechtheldens.xyz

## Operations on resources

All operations on resources are only allowed by Origin `https://www.brechtheldens.xyz`

### / (root)

`OPTIONS, GET`

No authentication required

### /user

`OPTIONS, GET`

**GET**: Requires authentication

### /users

`OPTIONS, POST`

**POST**: Requires authentication

### /users/{user_id}

`OPTIONS, POST, PUT, DELETE`

**POST**: Requires authentication
**PUT**: Requires authentication

### /products

`OPTIONS, GET, POST`

**GET**: No authentication required
**POST**: Requires authentication

### /products/{product_id}

`OPTIONS, GET, PUT, DELETE`

**GET**: No authentication required
**PUT**: Requires authentication
**DELETE**: Requires authentication

## User roles and permissions

### Normal user

Can create/update/delete products. Cannot modify or delete products from other users.

### Admin

Can delete products. Cannot create or modify products.

## Prevention of common web vulnerabilities

### CSRF Mitigation

Auth0 is used as identity provider. Upon login, the accesstoken is kept in memory at all times without setting a cookie.

### SQL Injection

Incoming data is never concatenated in a SQL query. Instead, the data gets bound to SQL parameters.
