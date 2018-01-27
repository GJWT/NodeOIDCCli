var OICCli = require('./init.js').OICCli;
var JWT_BEARER = require('./init.js').OICCli.JWT_BEARER;
var utf8 = require('utf8');
var base64url = require('base64url');

function Exception() {}

AuthenticationFailure.prototype = new Exception();
AuthenticationFailure.prototype = Object.create(Exception.prototype);
AuthenticationFailure.prototype.constructor = AuthenticationFailure;

function AuthenticationFailure() {
  Exception.call();
};

NoMatchingKey.prototype = new Exception();
NoMatchingKey.prototype = Object.create(Exception.prototype);
NoMatchingKey.prototype.constructor = NoMatchingKey;

function NoMatchingKey() {
  Exception.call();
};

UnknownAuthnMethod.prototype = new Exception();
UnknownAuthnMethod.prototype = Object.create(Exception.prototype);
UnknownAuthnMethod.prototype.constructor = NoMatchingKey;

function UnknownAuthnMethod() {
  Exception.call();
};

function ClientAuthnMethod() {};
/**
 * Add authentication information to a request
 */
ClientAuthnMethod.prototype.construct = function(kwargs) {
  console.log('Not Implemented')
};


ClientSecretBasic.prototype = new ClientAuthnMethod();
ClientSecretBasic.prototype = Object.create(ClientAuthnMethod.prototype);
ClientSecretBasic.prototype.constructor = ClientSecretBasic;

function ClientSecretBasic() {};

/**
 * :param cis: Request class instance
 * :param request_args: Request arguments
 * :param http_args: HTTP arguments
 * :return: dictionary of HTTP arguments
 */
ClientSecretBasic.prototype.construct = function(
    cis, cliInfo, requestArgs, httpArgs, kwargs) {
  cliInfo = cliInfo || null;
  requestArgs = requestArgs || null;
  httpArgs = httpArgs || null;

  if (httpArgs == null) {
    httpArgs = {};
  }

  var passwd = null;

  if (kwargs) {
    passwd = kwargs['password'];
  } else {
    if (httpArgs['password']) {
      passwd = httpArgs['password'];
    } else {
      if (cis['client_secret']) {
        passwd = cis['client_secret'];
      } else {
        passwd = cliInfo.client_secret;
      }
    }
  }

  var user = null;
  if (kwargs) {
    user = kwargs['user'];
  } else {
    user = cliInfo.client_id;
  }

  if (Object.keys(httpArgs).indexOf('headers') === -1) {
    httpArgs['headers'] = {};
  }

  var credentials = {};
  credentials[user] = passwd;

  // var authz = base64url.encode(credentials);
  // var authz = utf8.encode(credentials);
  // var authz =
  // base64.urlSafeb64Encode(credentials.encode('utf-8')).decode('utf-8');
  // //TODO
  httpArgs['headers']['Authorization'] = credentials;

  try {
    delete cis['client_secret'];
  } catch (err) {
    console.log('KeyError');
  }

  if (cis['grant_type'] === 'authorization_code') {
    if (Object.keys(cis).indexOf('client_id') === -1) {
      try {
        cis['client_id'] = cliInfo.client_id;
      } catch (err) {
        return;
      }
    }
  } else {
    var req = null;
    if (cis['client_id']) {
      req = cis['client_id'];
    } else {
      req = false;
    }

    if (!req) {
      try {
        delete cis['client_id'];
      } catch (err) {
        console.log(err);
      }
    }
  }
  return httpArgs;
};

ClientSecretPost.prototype = new ClientSecretBasic();
ClientSecretPost.prototype = Object.create(ClientSecretBasic.prototype);
ClientSecretPost.prototype.constructor = ClientSecretBasic;

function ClientSecretPost() {
  ClientSecretBasic.call();
};

/**
 * :param cis: Request class instance
 * :param request_args: Request arguments
 * :param http_args: HTTP arguments
 * :return: dictionary of HTTP arguments
 */
ClientSecretPost.prototype.construct = function(
    cis, cliInfo, requestArgs, httpArgs, kwargs) {
  if (Object.keys(cis).indexOf('client_secret')) {
    try {
      cis['client_secret'] = httpArgs['client_secret'];
      delete httpArgs['client_secret'];
    } catch (err) {
      if (cliInfo.client_secret) {
        cis['client_secret'] = cliInfo.client_secret;
      } else {
        console.log('Missing client secret');
      }
    }
  }

  cis['client_id'] = cliInfo.client_id;
  var list = [httpArgs, cis];
  return list;
};

var SINGLE_OPTIONAL_STRING = (String, false, null, null, false);

BearerHeader.prototype = new ClientAuthnMethod();
BearerHeader.prototype = Object.create(ClientAuthnMethod.prototype);
BearerHeader.prototype.constructor = BearerHeader;

function BearerHeader() {
  ClientAuthnMethod.call(this);
};

/**
 * More complicated logic then I would have liked it to be
 *      :param cis: Request class instance
 *      :param ci: Client information
 *      :param request_args: request arguments
 *      :param http_args: HTTP header arguments
 *      :param kwargs:
 *      :return:
 */
BearerHeader.prototype.construct = function(cis, cliInfo, httpArgs, kwargs) {
  cis = cis || null;
  cliInfo = cliInfo || null;
  httpArgs = httpArgs || null;

  var origCis = cis;
  var accToken = null;
  if (cis !== null) {
    if (Object.keys(cis).indexOf('access_token') !== -1) {
      accToken = cis['access_token'];
      delete cis['access_token'];
      // cis['access_token'] = SINGLE_OPTIONAL_STRING;
    } else {
      if (kwargs && kwargs['access_token']) {
        accToken = kwargs['access_token'];
      } else {
        accToken = cliInfo.stateDb.getTokenInfo(kwargs)['access_token'];
      }
    }
  } else {
    try {
      accToken = kwargs['access_token'];
    } catch (err) {
      console.log(err);
    }
  }

  var bearer = 'Bearer ' + accToken;

  if (httpArgs == null) {
    httpArgs = {'headers': {}};
    httpArgs['headers']['Authorization'] = bearer;
  } else {
    try {
      httpArgs['headers']['Authorization'] = bearer;
    } catch (err) {
      httpArgs['headers'] = {'Authorization': bearer};
    }
  }
  return httpArgs;
};

BearerBody.prototype = new ClientAuthnMethod();
BearerBody.prototype = Object.create(ClientAuthnMethod.prototype);
BearerBody.prototype.constructor = BearerBody;

function BearerBody() {
  ClientAuthnMethod.call();
};

/**
 * More complicated logic then I would have liked it to be
 *      :param cis: Request class instance
 *      :param ci: Client information
 *      :param request_args: request arguments
 *      :param http_args: HTTP header arguments
 *      :param kwargs:
 *      :return:
 */
BearerBody.prototype.construct =
    function(cis, cliInfo, requestArgs, httpArgs, kwargs) {
  if (requestArgs === null) {
    requestArgs = {};
  }

  if (Object.keys(cis).indexOf('access_token') !== -1) {
    return;
  } else {
    if (requestArgs['access_token']) {
      cis['access_token'] = requestArgs['access_token'];
    } else {
      if (!kwargs && !cliInfo.state) {
        console.log('Missing state specification');
      }
      kwargs['state'] = cliInfo.state;
      cis['access_token'] =
          cliInfo.stateDb.getTokenInfo(kwargs)['access_token'];
    }
  }
  var list = [httpArgs, cis];
  return list;
}

function bearerAuth(req, authn) {
  try {
    return req['access_token'];
  } catch (err) {
    assert.isTrue(authn.startsWith('Bearer '));
    return authn.substring(7, authn.length - 1);
  }
}

JWSAuthnMethod.prototype = new ClientAuthnMethod();
JWSAuthnMethod.prototype = Object.create(ClientAuthnMethod.prototype);
JWSAuthnMethod.prototype.constructor = JWSAuthnMethod;

function JWSAuthnMethod() {
  ClientAuthnMethod.call();
};

/**
 * More complicated logic then I would have liked it to be
 *      :param cis: Request class instance
 *      :param ci: Client information
 *      :param request_args: request arguments
 *      :param http_args: HTTP header arguments
 *      :param kwargs:
 *      :return:
 */
JWSAuthnMethod.prototype.chooseAlgorithm = function(entity, kwargs) {
  try {
    algorithm = kwargs['algorithm'];
  } catch (err) {
    algorithm = DEF_SIGN_ALG[entity];
  }

  if (!algorithm) {
    console.log('Missing algorithm specification');
  }
  return algorithm;
};

JWSAuthnMethod.prototype.getSigningKey = function(algorithm, cliInfo) {
  alg = alg || algorithm;
  return cliInfo.keyjar.getSigningKey(alg2keyType(algorithm), alg);
};

JWSAuthnMethod.prototype.getKeyByKid = function(kid, algorithm, cliInfo) {
  var key = cliInfo.keyjar.getKeyByKid(kid);
  if (key) {
    ktype = alg2keyType(algorithm);
    try {
      assert.deepEqual(key.kty, ktype);
    } catch (err) {
      console.log('Wrong key type');
    }
    return key;
  } else {
    console.log('No key with kid');
  }
};

/**
 * Constructs a client assertion and signs it with a key.
 *      The request is modified as a side effect.
 *      :param cis: The request
 *      :param request_args: request arguments
 *      :param http_args: HTTP arguments
 *      :param kwargs: Extra arguments
 *      :return: Constructed HTTP arguments, in this case none
 */
JWSAuthnMethod.prototype.construct = function(
    cis, cliInfo, requestArgs, httpArgs, kwargs) {
  if (kwargs.indexOf('clientAssertion') !== -1) {
    cis['clientAssertionType'] = kwargs['clientAssertion'];
    if (kwargs.indexOf('clientAssertionType') !== -1) {
      cis['clientAssertionType'] = kwargs['clientAssertionType'];
    } else {
      cis['clientAssertionType'] = JWTBEARER;
    }
  } else if (cis.indexOf('clientAssertion') !== -1) {
    if (cis.indexOf('clientAssertionType') !== -1) {
      cis['clientAssertionType'] = JWT_BEARER;
    }
  } else {
    algorithm = null;
    var tokenInfo = ['token', 'refresh'];
    if (tokenInfo.indexOf(kwargs['authEndpoint'])) {
      try {
        algorithm = cliInfo.registrationInfo['tokenEndpointAuthSigningAlg'];
      } catch (err) {
        return;
      }
      audience = cliInfo.providerInfo['tokenEndpoint'];
    } else {
      audience = cliInfo.providerInfo['issuer'];
    }

    if (!algorithm) {
      algorithm = this.chooseAlgorithm(kwargs);
    }

    ktype = alg2keyType(algorithm);
    var signingKey = null;
    try {
      if (kwargs.indexOf('kid')) {
        signingKey = [this.getKeyByKid(kwargs['kid'], algorithm, cliInfo)];
      } else if (cliInfo.kid['sig'].indexOf(ktype)) {
        try {
          signingKey =
              this.getKeyByKid(cliInfo.kid['sig'][ktype], algorithm, cliInfo);
        } catch (err) {
          signingKey = this.getSigningKey(algorithm, cliInfo);
        }
      } else {
        signingKey = this.getSigningKey(algorithm, cliInfo);
      }
    } catch (err) {
      console.log('No Matching Key');
    }

    try {
      args = {'lifetime': kwargs['lifetime']};
    } catch (err) {
      args = {};
    }

    cis['clientAssertion'] =
        assertionJwt(cliInfo.clientId, signingKey, audience, algorithm, args);
    cis['clientAssertionType'] = JWTBEARER;
  }

  try {
    delete cis['clientSecret'];
  } catch (err) {
    console.log('KeyError');
  }

  if (!cis.cParam['clientId'][VREQUIRED]) {
    try {
      delete cis['clientId'];
    } catch (err) {
      console.log('KeyError');
    }
  }

  return {};
};

ClientSecretJWT.prototype = new JWSAuthnMethod();
ClientSecretJWT.prototype = Object.create(JWSAuthnMethod.prototype);
ClientSecretJWT.prototype.constructor = ClientSecretJWT;

function ClientSecretJWT() {
  JWSAuthnMethod.call();
};

/**
 * More complicated logic then I would have liked it to be
 *      :param cis: Request class instance
 *      :param ci: Client information
 *      :param request_args: request arguments
 *      :param http_args: HTTP header arguments
 *      :param kwargs:
 *      :return:
 */
ClientSecretJWT.prototype.chooseAlgorithm = function(entity, kwargs) {
  entity = entity || 'clientSecretJwt';
  return JWSAuthnMethod.chooseAlgorithm(entity, kwargs);
};

ClientSecretJWT.prototype.getSigningKey = function(algorithm, cliInfo) {
  alg = alg || algorithm;
  return cliInfo.keyjar.getSigningKey(alg2keyType(algorithm), '', alg);
};

PrivateKeyJWT.prototype = new JWSAuthnMethod();
PrivateKeyJWT.prototype = Object.create(JWSAuthnMethod.prototype);
PrivateKeyJWT.prototype.constructor = PrivateKeyJWT;

function PrivateKeyJWT() {
  JWSAuthnMethod.call();
};

/**
 * More complicated logic then I would have liked it to be
 *      :param cis: Request class instance
 *      :param ci: Client information
 *      :param request_args: request arguments
 *      :param http_args: HTTP header arguments
 *      :param kwargs:
 *      :return:
 */
PrivateKeyJWT.prototype.chooseAlgorithm = function(entity, kwargs) {
  entity = entity || 'privateKeyJwt';
  return JWSAuthnMethod.chooseAlgorithm(entity, kwargs);
};

PrivateKeyJWT.prototype.getSigningKey = function(algorithm, cliInfo) {
  cliInfo = cliInfo || null;
  alg = alg || algorithm;
  return cliInfo.keyjar.getSigningKey(alg2keyType(algorithm), '', alg);
};

var CLIENT_AUTHN_METHOD = {
  'client_secret_basic': ClientSecretBasic,
  'client_secret_post': ClientSecretPost,
  'bearer_header': BearerHeader,
  'bearer_body': BearerBody,
  'client_secret_jwt': ClientSecretJWT,
  'private_key_jwt': PrivateKeyJWT,
};

var TYPE_METHOD = [(JWT_BEARER, JWSAuthnMethod)];

function validClientInfo(cInfo, when) {
  var eta = cInfo['client_secret_expires_at'] || 0;
  var now = when || Date.now();
  if (eta !== 0 && eta < now) {
    return false;
  }
  return true;
}

module.exports.AuthenticationFailure = AuthenticationFailure;
module.exports.NoMatchingKey = NoMatchingKey;
module.exports.UnknownAuthnMethod = UnknownAuthnMethod;
module.exports.CLIENT_AUTHN_METHOD = CLIENT_AUTHN_METHOD;
module.exports.ClientSecretBasic = ClientSecretBasic;
module.exports.ClientSecretPost = ClientSecretPost;
module.exports.BearerHeader = BearerHeader;
module.exports.BearerBody = BearerBody;
module.exports.JWSAuthnMethod = JWSAuthnMethod;
module.exports.ClientSecretJWT = ClientSecretJWT;
module.exports.PrivateKeyJWT = PrivateKeyJWT;
module.exports.validClientInfo = validClientInfo;