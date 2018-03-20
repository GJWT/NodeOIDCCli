const oidcservice = require('oidc-service');

/**
 * Perform full OIDC Discovery + Dynamic Registration + Authorization Code Flow
 *
 * @param {function} getClient   async (issuer) => Client object (see above).
 * @param {function} storeClient async (client) => <> (should throw on failure).
 * @param {Object}   clientMeta  Object with client metadata for registration.
 * @param {string}   identifier  The user identifier for webfinger lookup.
 *
 * @throws  ...if any step fails.
 *
 * This would normally NOT be ONE function, even if it could be technically
 * with some promise juggling async dataflow between requests as long as the
 * end-user is only using a single running instance of the RP...
 */
async function authorize({
  getClient, storeClient, clientMeta, getKey, identifier,
}) {
  /* WebFinger */

  // Getting the OIDC OP issuer from identifier (using webfinger)
  // NB: I see no purpose in forming requests and parsing response separately,
  // so this is a simple async function.
  // NB2: This function performs identifier normalization, see OIDC Discovery
  // 2.1, might handle caching internally.
  const issuer = await oidcservice.getIssuerFromIdentifier(identifier);


  /* Provider info discovery */

  // Always a GET to a URL matching issuer + /.well-known/openid-configuration,
  // still no need to decouple request and response.
  const openidConfig = await oidcservice.getOIDCConfig(issuer);

  // Get a client to use for this issuer, either from DB or register a new one
  let client = await getClient(issuer);

  if (!client) {
    /* Client registration */

    client = await oidcservice.registerClient({openidConfig, clientMeta});
    await storeClient(client);
  }


  /* Authorization */

  // Here is the first point where there is actually different HTTP methods and
  // delivery systems involved, and with reason to form the request separately.

  // In this case, let's construct a 302 redirect for our end-user.  This would
  // be using oidcmsg.AuthorizationRequest.toURLEncoded in the implementation.
  // The Authorization module would know how to form a redirect URL, but we
  // could add scopes and other authorization parameters.
  const {state, nonce, authorizeUri} =
    await oidcservice.getAuthorizationRedirect({
      openidConfig, client, options: {
        scope: 'openid',
        responseType: 'code',
        redirectUri: 'https://example.com/cb', // ...if the client has more than one
      },
    });

  // ...redirecting end-user to authorizeUri, not shown here
  console.log(`Redirecting end-user to ${authorizeUri}`);

  // ...user returns from a redirect to RP's callback URL. pathname and search
  // are parts of the callback request URL object (node WHATWG standard).
  const pathname = '/cb';
  const search = '?code=SplxlOBeZQQYbYS6WxSbIA&state=af0ifjsldkj';
  const code = oidcservice.parseAuthorizationReturnUri({state, pathname, search});


  /* Access token */
  // getTokens function performs token request and validates response as well
  // as parses and validates the idToken
  const {accessToken, tokenType, refreshToken, expiresIn, idToken} =
    await oidcservice.getTokens({
      openidConfig, state, code, client, nonce, getKey,
      redirectUri: 'https://example.com/cb',
    });

  console.log({accessToken, tokenType, refreshToken, expiresIn, idToken});


  /* User info */
  const userInfo = oidcservice.getUserInfo({client, openidConfig, accessToken});
  console.log(userInfo);
}

/**
 * Example of clients db for mongo storage where clients are identified by issuer
 *
 * @param {function} getCollection  async () => MongoDB-collection
 *
 * Clients are represented by a document in the format `{ issuer, metadata }`
 * where metadata is in the format described in
 * http://openid.net/specs/openid-connect-registration-1_0.html#ClientMetadata
 */
const mongoGetClient = (getCollection) => async (issuer) => {
  const collection = await getCollection();
  return collection.findOne({issuer});
};
const mongoStoreClient = (getCollection) => async (client) => {
  const collection = await getCollection();
  return collection.insertOne(client);
};

const keyClientsByIssuer = {};
/**
 * Basic getKey for RSA keys by issuer, requires jwksUri for new issuers (to
 * not do discovery double)
 */
async function cachingGetKey({header, claims, jwksUri}) {
  if (!('iss' in claims)) throw new Error('Cannot get key without issuer');
  if (!('kid' in header)) throw new Error('Cannot get key without kid');

  if (!(claims.iss in keyClientsByIssuer)) {
    keyClientsByIssuer[claims.iss] = jwksClient({jwksUri});
  }

  return new Promise(
    (res, rej) => keyClientsByIssuer[claims.iss].getSigningKey(header.kid, (err, key) => {
      if (err) return rej(err);
      res(key.publicKey || key.rsaPublicKey);
    })
  );
}

// Perform an authorizaion flow for identifier 'fredrik@liljegren.org'
authorize({
  getClient: mongoGetClient(myGetCollection),
  storeClient: mongoStoreClient(myGetCollection),
  clientMeta: {
    'redirectUris': ['https://example.com/cb'],
    'logoUri': 'https://example.com/logo.svg',
    'logoUri#sv-SE': 'https://example.com/swedish-logo.svg',
  },
  getKey: cachingGetKey,
  identifier: 'fredrik@liljegren.org',
});
