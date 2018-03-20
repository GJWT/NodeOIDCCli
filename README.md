OpenID Connect Services
=======================

[![Build Status](https://secure.travis-ci.org/GJWT/nodeOIDCClient?branch=master)](http://travis-ci.org/GJWT/nodeOIDCClient)

Helper to handle client communication with an OpenID Connect OP.

Note that for a Relying Party (RP) you would probably use the higher level API
from https://secure.travis-ci.org/GJWT/nodeOIDCRP instead.

This library is responsible for both OIDC discovery and registration.


API
---


### async getIssuerFromIdentifier(identifier)

* Param {string} identifier
* [Normalizes identifier](http://openid.net/specs/openid-connect-discovery-1_0.html#IdentifierNormalization)
* Uses WebFinger (with request caching?) to get issuer.
* Returns issuer as string.


### async getOIDCConfig(issuer)

* Calls [ProviderConfig](http://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig)
* Validates and returns openidConfig


### async registerClient({openidConfig, clientMeta})

* Param {Object} openidConfig, from getOIDCConfig.
* Param {Object} [client metadata](http://openid.net/specs/openid-connect-registration-1_0.html#ClientMetadata).
* Registers the client with the OP.
* Returns the client object as {issuer, metadata}.


### getAuthorizationRedirectUri({openidConfig, client, options})

* Param {Object} options For AuthorizationRequest adding to and overriding the defaults.
* Creates state and nonce (if not given in options).
* Constructs the AuthorizeRequest from given parts and options.
* Returns {state, nonce, authorizeUri} for a GET.

Example:

```javascript
const {state, nonce, authorizeUri} =
  await oidcservice.getAuthorizationRedirect({
    openidConfig, client, options: {
      scope: 'openid',
      responseType: 'code',
      redirectUri: 'https://example.com/cb', // ...if the client has more than one
    },
  });
```

### getAuthorizationPost({openidConfig, client, options})

* See getAuthorizationRedirectUri
* Returns {state, nonce, authorizeUri, body} for a POST.


### parseAuthorizationReturnUri({state, uri, options})

* Param {Object} options, same object as to getAuthorization.
* Param {string} state - matching the request.
* Param {Object} uri  A URI object with search and/or hash.
* Returns {object} with parsed/validated AuthorizationResponse.
  * When options.responseType includes token, return will include accessToken
  * When options.responseType includes id_token, return will include unparsed idToken
  * When options.responseType includes code, return will include code (to use of getTokens)


### async getTokens({openidConfig, state, code, client, nonce, getKey, redirectUri})

* Param {function} getKey  async ({iss, kid, jwksUri}) => signingKey

* Return parsed and validated idToken (with help from getKey, nonce, openidConfig, client)



### async getUserInfo({client, openidConfig, accessToken})
