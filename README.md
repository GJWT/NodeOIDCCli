OpenID Connect Relying Party
============================

[![Build Status](https://secure.travis-ci.org/GJWT/nodeOIDCClient?branch=master)](http://travis-ci.org/GJWT/nodeOIDCClient)

Helper to handle client communication with an OpenID Connect OP.

Note that for a Relying Party (RP) you would probably use the higher level API
from https://secure.travis-ci.org/GJWT/nodeOIDCRP instead.

This library is responsible for both OIDC discovery and registration.


Example usage from an RP without prior client
---------------------------------------------

Getting an `identifier` from the user, using webfinger to discover the OP
issuer, getting openid-configuration and using that to register a new client.

```javascript
const oidcclient = require('oidc-client');

/**
 * Get a client to use, either from storage or register a new one.
 */
async function getClient({ identifier, getClient, registerClient, clientMetadata }) {
  // Getting the OIDC OP issuer from identifier (using webfinger)
  const issuer = await oidcclient.getIssuerFromIdentifier(identifier);

  // Check existing clien storage first.
  const oldClient = await getClient(issuer);
  if (oldClient) return oldClient;

  // Prepare dynamic registration.
  const openidConfig = await oidcclient.getOIDCConfig(issuer);

  // Register a new client.
  const client = await oidcclient.register({ openidConfig, clientMetadata });

  // Store the client keyed on issuer (awaiting to propagate throws)
  await registerClient({ issuer, client });

  return client
}
```
