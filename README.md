# software-security-backend

Backend voor opgave 2 - Software Security

## Operations on resources

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
