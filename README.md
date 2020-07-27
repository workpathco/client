![](https://github.com/workpathco/client/workflows/Tests/badge.svg)



# Workpath Web Client
> JavaScript client for OAuth authorization code flow.

This package was created to help single page applications connect to Workpath using oauth's authorization code flow.

## Installation

```sh
npm install @workpathco/client --save
```
or
```sh
yarn add @workpathco/client
```

## Usage example

First instantiate an authentication object passing the client id and redirect uri you've obtained from the [Workpath Client Dashboard](https://api-prod.workpath.co/clients).

```javascript
import { Authenticate } from "@workpathco/client"

const authentication = new Authenticate({
  client_id: "XXXXX-XXXXX-XXXXX-XXXXX", // insert your client id here
  redirect_uri: "https://your-redirect-uri.here", // insert your redirect uri added when creating your client
})
```
Next, use the instantiated authentication object to login:

```javascript
authentication.login()
```
This will create a unique login url and redirect the user to the Workpath login page.

After the user signs in they will be redirected back to the specified `redirect_uri` where you will consume the request using the `consume` function as follows:

```javascript
await authentication.consume()
```

Immediately after a successful authorization consumption you will be able to access the token by calling `getToken` as follows:

```javascript
const token = authentication.memory.getToken()
```

This token is only set in memory so you will need to manage it's storage yourself. (Note: These token are valid for 24 hours at which point they will expire and the user will need to re-authenticate)

For instance, using session cookies:

```javascript
cookie.set("_wp_token", JSON.stringify(token));
```
All subsequent authenticated requests can be made with the `access_token` added as an Authorization request header as follows:

```sh
Authorization: Bearer XXXX-XXXX-XXXX-XXXX
```

An example react implementation can be found [here](https://github.com/workpathco/client/tree/master/example)