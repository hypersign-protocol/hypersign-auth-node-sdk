# Hypersign Auth Js Sdk

The Hypersign SDK supports the few methods which can be used as middleware in your nodejs project. You can either implement hypersign using websocket (by default). Or you can use polling mechanism.  


1. [hypersign.authenticate()](/docs.md#hypersignauthenticate)
2. [hypersign.authorize()](/docs.md#hypersignauthorize)
3. [hypersign.challenge()](/docs.md#hypersignchallenge)
4. [hypersign.poll()](/docs.md#hypersignpoll)
5. [hypersign.refresh()](/docs.md#hypersignrefresh)
6. [hypersign.logout()](/docs.md#hypersignlogout)
7. [hypersign.register()](/docs.md#hypersignregister)
8. [hypersign.issueCredential()](/docs.md#hypersignissueCredential)

---


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

Request Query Param

```js
{
    token,
    did
}
```


Returns


```js
{
  success: true,
  message: 'Verifiable Credential',
  data: {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      [Object],
      [Object],
      [Object]
    ],
    id: 'vc_bd9762db-895c-4cfd-a000-da483ee662c5',
    type: [ 'VerifiableCredential', 'Hypersign RP' ],
    expirationDate: '2021-11-25T09:12:53.953Z',
    issuanceDate: '2021-11-25T09:12:54.178Z',
    issuer: 'did:hs:d86asdasd682-9a09-f68a51678cec',
    credentialSubject: {
      name: 'vishwas',
      email: 'blablabla@gmail.comm',
      id: 'did:hs:9f6a198123ASDADbb5cd69'
    },
    proof: {
      type: 'Ed25519Signature2018',
      created: '2021-11-25T09:12:55Z',
      jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmsdadasdQiOlsiYjY0Il19..JjqDeUwQjH8b7SLasd232212RF5lge_W7RvkBGHxTi0G8SRTHPiBHAA',
      proofPurpose: 'assertionMethod',
      verificationMethod: 'did:hs:d86asdasd682-9a09-f68a51678cec#z6MkpBK9LoPUgoTUtnXfrgGmt6c9jaGQYoG2xWuF3xgjP2GD'
    }
  }
}
```
