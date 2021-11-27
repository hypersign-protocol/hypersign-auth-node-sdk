# Hypersign dAuth Javascript Frontend SDK

## Step1: Create a DOM with id `hs-auth-btn`

```html
<div id="hs-auth-btn"></div>
```

## Step2: Add appropriate script

You can use Hypersign dAuth in either of two modes.

1. Websocket
2. Polling

### Using Websocket

```js
<script src="index.js" data-rp-socket-url="ws://localhost:4006"></script>
```

Other optional paramaters: 

```js
<script
  src="index.js"
  data-network-mode="TEST" // Network mode TEST | MAIN. Default value 'MAIN'
  data-listener-mode="SOCKET" // Listener mode SOCKET | POLLING. Default value 'SOCKET'
  data-rp-socket-url="ws://localhost:4006" // Relying party websocket URL
  data-login-button-text="lOGIN wITH hYPERSIGN" // Login button text. Default 'LOGIN USING HYPERSIGN'
></script>
```

### Using Polling

```js
<script src="index.js" 
    data-listener-mode='POLLING'
    data-rp-server-base-url='http://localhost:4006'
>
</script> 
```
Other optional paramaters: 

```js
<script
  src="index.js"
  data-network-mode="TEST" // Network mode TEST | MAIN. Default value 'MAIN'
  data-listener-mode="POLLING" // Listener mode SOCKET | POLLING. Default value 'SOCKET'
  data-rp-server-base-url="http://localhost:4006" // Relying party server base URL
  data-rp-challege-resource="/challenge" // Challenge resource path. Default value '/api/v1/auth/challenge'
  data-rp-polling-resource="/poll" // Polling resource path. Default value '/api/v1/auth/poll'
  data-login-button-text="lOGIN wITH hYPERSIGN" // Login button text. Default 'LOGIN USING HYPERSIGN'
  data-polling-interval="5000" // Polling interval. Default value 5000
></script>
```
