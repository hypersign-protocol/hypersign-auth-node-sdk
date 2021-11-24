# Hypersign Auth Js Sdk

### hypersign.authenticate()

Authenticates a user by verifying verifiable presentation sent by a user via wallet

Request Body:

```js
{
    challenge,
    vp
}
```

Returns:

```js
hypersign: {
    success: true,
    message: "Authenticated Successfully",
    data: {
        user: {
            name: "Vishwas",
            email: "testEmail@gmail.com",
            id: "did:hs:12312SSSFSDFSDF"
        },
        accessToken: "",
        refreshToken: ""
    }
}
```

### hypersign.authorize()

Verifies accessToken and returns payload

Request Header: 

```js
{
    Authorization: Bearer <AccessToken>
}
```

Returns:

```js
hypersign: {
    success: true,
    message: "Authorized successfully",
    data: {
        name: "Vishwas",
        email: "testEmail@gmail.com",
        id: "did:hs:12312SSSFSDFSDF"
    }
}
```

### hypersign.challenge()

Generates QR data (with challenge) in case the service provider does not want to uee websocket and go with polling

Returns

```js
hypersign: {
    success: true,
    message: "New session data",
    data: {
        accessToken: "",
        refreshToken: ""  
    }
}
```


### hypersign.poll()

Call this to periodically check if a user has authenticated or not via wallet

Request query: 

```js
{ challenge }
```

Returns

```js
hypersign: {
    success: true,
    message: "User is authenticated",
    data: {
        accessToken: "",
        refreshToken: ""
    }
}
```

### hypersign.refresh()

Generates accessToken and refreshToken pair. [RFC6749](https://www.rfc-editor.org/rfc/rfc6749#section-6)

Request Header: 

```js
{
    refreshtoken: Bearer <RefreshToken>
}
```

Returns:

```js
hypersign: {
    success: true,
    message: "New pair of tokens",
    data: {
        accessToken: "",
        refreshToken: ""
    }
}
```


### hypersign.logout()

Logs out a user.

Request Header: 

```js
{
    refreshtoken: Bearer <RefreshToken>
}
```

### hypersign.register()

Registers a new user and sends email.

Request body

```js
{
    user, 
    isThridPartyAuth
}
```

Returns

```js
hypersign: {
    success: true,
    message: "Verifiable Credential",
    data: vc
}
```


### hypersign.issueCredential()

Verifies the verifiable credential  JWT and issues auth verifiable credential