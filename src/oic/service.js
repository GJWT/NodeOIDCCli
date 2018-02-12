
var OAuth2Authorization = require('../oauth2/service').Authorization;
var OAuth2AccessToken = require('../oauth2/service').AccessToken;
var OAuth2RefreshAccessToken = require('../oauth2/service').RefreshAccessToken;
var OAuth2ProviderInfoDiscovery =
    require('../oauth2/service').ProviderInfoDiscovery;
var Service = require('../service');
var Token = require('../../oicMsg/src/models/tokenProfiles/token');

var PREFERENCE2PROVIDER = {
  'require_signed_request_object': 'request_object_algs_supported',
  'request_object_signing_alg': 'request_object_signing_alg_values_supported',
  'request_object_encryption_alg':
      'request_object_encryption_alg_values_supported',
  'request_object_encryption_enc':
      'request_object_encryption_enc_values_supported',
  'userinfo_signed_response_alg': 'userinfo_signing_alg_values_supported',
  'userinfo_encrypted_response_alg': 'userinfo_encryption_alg_values_supported',
  'userinfo_encrypted_response_enc': 'userinfo_encryption_enc_values_supported',
  'id_token_signed_response_alg': 'id_token_signing_alg_values_supported',
  'id_token_encrypted_response_alg': 'id_token_encryption_alg_values_supported',
  'id_token_encrypted_response_enc': 'id_token_encryption_enc_values_supported',
  'default_acr_values': 'acr_values_supported',
  'subject_type': 'subject_types_supported',
  'token_endpoint_auth_method': 'token_endpoint_auth_methods_supported',
  'token_endpoint_auth_signing_alg':
      'token_endpoint_auth_signing_alg_values_supported',
  'response_types': 'response_types_supported',
  'grant_types': 'grant_types_supported'
};

var PROVIDER2PREFERENCE = {};

for (var i = 0; i < Object.keys(PREFERENCE2PROVIDER).length; i++) {
  var k = Object.keys(PREFERENCE2PROVIDER)[i];
  var v = PREFERENCE2PROVIDER[k];
  PROVIDER2PREFERENCE[k] = v;
};

var PROVIDER_DEFAULT = {
  'token_endpoint_auth_method': 'client_secret_basic',
  'id_token_signed_response_alg': 'RS256',
};

Authorization.prototype = new OAuth2Authorization();
Authorization.prototype = Object.create(OAuth2Authorization.prototype);
Authorization.prototype.constructor = Authorization;

function Authorization() {};

/**
 * :param cis: Request class instance
 * :param request_args: Request arguments
 * :param http_args: HTTP arguments
 * :return: dictionary of HTTP arguments
 */
Authorization.prototype.init = function(httpLib, keyJar, clientAuthnMethod) {
  OAuth2Authorization.prototype.init(httpLib, keyJar, clientAuthnMethod);
  this.defaultRequestArgs = {'scope': ['openId']};
  this.preConstruct = [this.oicPreConstruct];
  this.postConstruct = [this.oicPostConstruct];
};

Authorization.prototype.oicPreConstruct = function(
    cliInfo, requestArgs, kwargs) {
  var rt = null;
  if (requestArgs != null) {
    rt = requestArgs['response_type'];
    if (rt.indexOf('token') || rt.indexOf('idToken')) {
      if (Object.keys(requestArgs).indexOf('nonce') !== -1) {
        requestArgs['nonce'] = rndstr(32);
      }
    }
  } else {
    requestArgs = {'nonce': rndstr(32)};
  }

  postArgs = {};

  var attributes = ['request_object_signing_alg', 'algorithm', 'sig_kid'];
  for (var i = 0; i < attributes.length; i++) {
    var attr = attributes[i];
    try {
      postArgs[attr] = kwargs[attr];
    } catch (err) {
      console.log(err);
    }
    if (kwargs && kwargs[attr]) {
      delete kwargs[attr];
    }
  }

  if (kwargs && kwargs.indexOf('requestMethod') !== -1) {
    if (kwargs['requestMethod'] == 'reference') {
      postArgs['requestParam'] = 'requestUri';
    } else {
      postArgs['requestParam'] = 'request';
    }
    delete kwargs['requestMethod'];
  }

  var responseMod = null;
  try {
    responseMod = cliInfo.behavior['response_mode'];
  } catch (err) {
    console.log('KeyError');
  }
  if (responseMod == 'formPost') {
    requestArgs['response_mode'] = responseMod;
  }

  var list = [requestArgs, postArgs];

  return list;
};

Authorization.prototype.oicPostConstruct = function(cliInfo, req, kwargs) {
  var requestParam = null;
  try {
    requestParam = kwargs['request_param'];
  } catch (err) {
    return req;
  }
  delete kwargs['request_aram'];

  var alg = null;

  var args = ['request_object_signing_alg', 'algorithm'];
  for (var i = 0; i < args.length; i++) {
    var arg = args[i];
    try {
      alg = kwargs[arg];
    } catch (err) {
      console.log(err);
    }
  }

  if (!alg) {
    try {
      alg = cliInfo.behavior['request_object_signing_alg'];
    } catch (err) {
      alg = 'RS256';
    }
  }

  kwargs['request_object_signing_alg'] = alg;

  if (Object.keys(kwargs).indexOf('keys') === -1 && alg && alg !== null) {
    kty = jws.alg2keyType(alg);
    try {
      kid = kwargs['sigKid'];
    } catch (err) {
      kid = cliInfo.kid['sig'].get(kty, null);
    }

    kwargs['keys'] = cliInfo.keyJar.getSigningKey(kty, kid);
  }

  // req = this.makeOpenIdRequest(req, kwargs);
  // req = this.requestObjectEncryption(req, cliInfo, kwargs);

  if (requestParam == 'request') {
    req['request'] = req;
  } else {
    var webName = null;
    var fileName = null;

    /*
    try {
      webName = cliInfo.registrationResponse['requestUris'][0];
      fileName = cliInfo.fileNameFromWebName(webName);
    } catch (err) {
      var pair = constructRequestUri(kwargs);
      var fileName = pair[0];
      var webName = pair[1];
    }
  
    mode = mode || 'w';
    var fid = open(fileName, mode);
    fid.write(req);
    fid.close();
    req['requestUri'] = webName;*/
  }
  return req;
};

AccessToken.prototype = new OAuth2AccessToken();
AccessToken.prototype = Object.create(OAuth2AccessToken.prototype);
AccessToken.prototype.constructor = AccessToken;

function AccessToken() {};

/**
 * :param cis: Request class instance
 * :param request_args: Request arguments
 * :param http_args: HTTP arguments
 * :return: dictionary of HTTP arguments
 */
AccessToken.prototype.init = function(httpLib, keyJar, clientAuthnMethod) {
  httpLib = httpLib || null;
  keyJar = keyJar || null;
  clientAuthnMethod = clientAuthnMethod || null;
  OAuth2AccessToken.prototype.init(httpLib, keyJar, clientAuthnMethod);
  this.postParseResponse = [this.oicPostParseResponse];
};

AccessToken.prototype.oicPostParseResponse = function(
    resp, cliInfo, state, kwargs) {
  try {
    idt = resp['verifiedIdToken'];
  } catch (err) {
    console.log(err);
  }
  try {
    if (cliInfo.stateDb.nonceToState(idt['nonce']) !== state) {
      console.log('Parameter Error : Someone has messed with nonce');
    }
  } catch (err) {
    console.log(err);
  }
};

RefreshAccessToken.prototype = new OAuth2RefreshAccessToken();
RefreshAccessToken.prototype =
    Object.create(OAuth2RefreshAccessToken.prototype);
RefreshAccessToken.prototype.constructor = RefreshAccessToken;

function RefreshAccessToken() {
  this.msgType = oic.RefreshAccessTokenRequest;
  this.responseCls = oic.AccessTokenResponse;
  this.errorMsg = oic.TokenErrorResponse;
}

ProviderInfoDiscovery.prototype = new OAuth2ProviderInfoDiscovery();
ProviderInfoDiscovery.prototype = Object.create(OAuth2ProviderInfoDiscovery);
ProviderInfoDiscovery.prototype.constructor = ProviderInfoDiscovery;

function ProviderInfoDiscovery() {
  this.msgType = oic.Message;
  this.responseCls = oic.AccessTokenResponse;
  this.errorMsg = oic.TokenErrorResponse;
}

ProviderInfoDiscovery.prototype.oicPostParseResponse =
    function(resp, cliInfo, state, kwargs) {
  this.matchPreferences(cliInfo, resp, cliInfo.issuer);
}

ProviderInfoDiscovery.prototype.matchPreferences =
        function(resp, cliInfo, state, kwargs) {
  if (!pcr) {
    pcr = cliInfo.providerInfo;
  }

  var regreq = oic.registrationResponse;

  var vals = null;
  for (var i = 0; i < PREFERENCE2PROVIDER.items(); i++) {
    try {
      vals = cliInfo.clientPrefs[pref];
    } catch (err) {
      continue;
    }

    try {
      var pVals = pcr[prov];
    } catch (err) {
      try {
        pVals = PROVIDER_DEFAULT[_pref];
      } catch (err) {
        console.log('No info from provider');

        if (cliInfo.strictOnPreferences) {
          console.log('OP couldnt match preference');
        } else {
          pvals = vals;
        }
      }
    }
    if (vals instanceof String) {
      if (pvals.indexOf(vals) !== -1) {
        cliInfo.behavior[pref] = vals;
      }
    } else {
      vTyp = regreq.cParam[pref];

      if (vtyp[0] instanceof list) {
        cliInfo.behavior[pref] = [];
        for (var i = 0; i < vals.length; i++) {
          if (val in pVals) {
            cliInfo.behavior[pref].push(val);
          }
        }
      } else {
        for (var i = 0; i < vals.length; i++) {
          if (pvals.indexOf(val) === -1) {
            cliInfo.behavior[pref] = val;
            break;
          }
        }
      }
    }

    if (cliInfo.behavior.indexOf(pref) === -1) {
      console.log('OP couldnt match preference');
    }
  }
  for (var i = 0; i < cliInfo.clientPrefs.items().length; i++) {
    if (cliInfo.behavior.indexOf(key) !== -1) {
      continue;
    }

    try {
      var vTyp = regreq.cParam[key];
      if (vtyp[0] instanceof list) {
        return;
      } else if (val instanceof list && !(val instanceof String)) {
        val = val[0];
      }
    } catch (err) {
      console.log(err);
    }

    if (PREFERENCE2PROVIDER.indexOf(key) !== -1) {
      cliInfo.behavior[key] = val;
    }
  }

  console.log('CliInfo Behavior');
}

Registration.prototype = new Service();
Registration.prototype = Object.create(Service.prototype);
Registration.prototype.constructor = Registration;

function Registration() {
  this.msgType = oic.RegistrationRequest;
  this.responseCls = oic.RegistrationResponse;
  this.errorMsg = ErrorResponse;
  this.endpointName = 'registrationEndpoint';
  this.synchronous = true;
  this.request = 'registration';
  this.bodyType = 'json';
  this.httpMethod = 'POST';
};

Registration.prototype.init = function(httpLib, keyJar, clientAuthnMethod) {
  httpLib = httpLib || null;
  this.preConstruct = [this.oicPreConstruct];
  this.postParseResponse.push(this.oicPostParseResponse);
};

/**
 * Create a registration request
 *
 * param kwargs: parameters to the registration request
 * return;
 */
Registration.prototype.oicPreConstruct = function(
    cliInfo, requestArgs, kwargs) {
  for (var i = 0; i < this.msgType.cParam.keys().length; i++) {
    var prop = this.msgType.cParam.keys()[i];
    if (requestArgs.indexOf(prop) !== -1) {
      continue;
    }
    try {
      requestArgs[prop] = cliInfo.behavior[prop];
    } catch (err) {
      console.log(err);
    }
  }

  if (requestArgs.indexOf('postLogoutRedirectUris') === -1) {
    try {
      requestArgs['postLogoutRedirectUris'] = cliInfo.postLogoutRedirectUris;
    } catch (err) {
      console.log(err);
    }
  }

  if (requestArgs.indexof('redirectUris') === -1) {
    try {
      requestArgs['redirectUris'] = cliinfo.redirectUris;
    } catch (err) {
      console.log('Missing Required Attribute : redirectUris ' + requestArgs);
    }
  }

  try {
    if (cliInfo.providerInfo['requireRequestUriRegistration'] === true) {
      requestArgs['requestUris'] =
          cliinfo.generateRequestUris(cliInfo.requestDir);
    }
  } catch (err) {
    console.log(err);
  }
};

Registration.prototype.oicPostParseResponse = function(resp, cliInfo, kwargs) {
  cliInfo.registrationResponse = resp;
  if (cliInfo.registrationResponse.indexOf('tokenEndpointAuthnMethod') === -1) {
    cliInfo.registrationResponse['tokenEndpointAuthMethod'] =
        'clientSecretBasic';
  }
  cliInfo.clientId = resp['clientId'];
  try {
    cliInfo.clientSecret = resp['clientSecret'];
  } catch (err) {
    console.log(err);
  }
  try {
    cliInfo.registrationExpires = resp['clientSecretExpiresAt'];
  } catch (err) {
    console.log(err);
  }

  try {
    cliInfo.registrationAccessToken = resp['registrationAccessToken'];
  } catch (err) {
    console.log(err);
  }
};

UserInfo.prototype = new Service();
UserInfo.prototype = Object.create(Service.prototype);
UserInfo.prototype.constructor = UserInfo;
UserInfo.prototype.defaultAuthnMethod = 'bearer_header';

function UserInfo() {
  this.msgType = Token;
  this.responseCls = oic.OpenIDSchema;
  this.errorMsg = oic.UserInfoErrorResponse;
  this.endpointName = 'userinfo_endpoint';
  this.synchronous = true;
  this.request = 'userinfo';
  this.defaultAuthnMethod = 'bearer_header';
  this.httpMethod = 'POST';
};

UserInfo.prototype.init = function(httpLib, keyJar, clientAuthnMethod) {
  Service.prototype.init(httpLib, keyJar, clientAuthnMethod);
  this.preConstruct = [this.oicPreConstruct];
  this.postParseResponse = [this.oicPostParseResponse];
};

UserInfo.prototype.oicPreConstruct = function(cliInfo, requestArgs, kwargs) {
  if (requestArgs === null) {
    requestArgs = {};
  }

  if (Object.keys(requestArgs).indexOf('accessToken') !== -1) {
    return;
  } else {
    var tInfo = cliInfo.stateDb.getTokenInfo(kwargs);
    requestArgs['access_token'] = tInfo['access_token'];
  }
  var list = [requestArgs, {}];
  return list;
};

UserInfo.prototype.oicPostParseResponse = function(resp, cliInfo, kwargs) {
  resp = this.unpackAggregatedClaims(resp, clientInfo);
  return this.fetchDistributedClaims(resp, clientInfo);
};

UserInfo.prototype.unpackAggregatedClaims = function(userInfo, cliInfo) {
  var csrc = null;
  try {
    csrc = userInfo['claimsSources'];
  } catch (err) {
    console.log(err);
  }
  for (var i = 0; i < csrc.items().length; i++) {
    var pair = csrc.items()[i];
    var csrc = pair[0];
    var spec = pair[1];
    if (spec.indexOf('JWT')) {
      var aggregatedClaims =
          Message().fromJwt(spec['JWT'].encode('utf-8'), cliInfo.keyJar);
      for (var i = 0; i < userInfo['claimNames'].items(); i++) {
        userInfo[key] = aggregatedClaims[key];
      }
    }
  }
  return userInfo;
};

UserInfo.prototype.fetchDistributedClaims = function(
    userInfo, cliInfo, callBack) {
  callBack = callBack || null;
  try {
    csrc = userInfo['claimSources'];
  } catch (err) {
    console.log(err);
  }
  var uInfo = null;
  for (var i = 0; i < csrc.items().length; i++) {
    if (spec.indexOf('endpoint') !== -1) {
      if (spec.indexOf('accessToken')) {
        var uInfo = this.serviceRequest(
            spec['endpoint'], 'GET', spec['accessToken'], cliInfo);
      } else {
        if (callback) {
          uInfo = this.serviceRequest(
              spec['endpoint'], 'GET', callback(spec['endpoint']), cliInfo);
        } else {
          uInfo = this.serviceRequest(spec['endpoint'], 'GET', cliInfo);
        }
      }

      var claims = [];
      for (var i = 0; i < userInfo['claimNames'].items().length; i++) {
        var pair = userInfo['claimNames'].items()[i];
        var value = pair[0];
        var src = pair[1];
        if (src === csrc) {
          claims.push(value);
        }
      }

      if (set(claims) !== set(uinfo.keys())) {
        console.log(
            'Claims from claim source doesn\'t match what\'s in the user info');
      }

      for (var i = 0; i < uinfo.items(); i++) {
        var pair = uinfo.items()[i];
        var key = pair[0];
        var val = pair[1];
        userInfo[key] = vals;
      }
    }
  }
  return userInfo;
};

UserInfo.prototype.setIdToken = function(cliInfo, requestArgs, kwargs) {
  if (requestArgs === null) {
    requestArgs = {};
  }
  try {
    var prop = kwargs['prop'];
  } catch (err) {
    prop = 'idToken';
  }
  if (requestArgs.indexOf(prop) !== -1) {
    return;
  } else {
    var state = this.getState(requestArgs, kwargs);
    var idToken = cliInfo.stateDb.getIdToken(state);
    if (idToken == null) {
      console.log('No valid id token available');
    }
    requestArgs[prop] = idToken;
  }
  return requestArgs;
};

CheckSession.prototype = new Service();
CheckSession.prototype = Object.create(Service.prototype);
CheckSession.prototype.constructor = CheckSession;

function CheckSession() {
  this.msgType = oic.CheckSessionRequest;
  this.responseCls = Message;
  this.errorMsg = ErrorResponse;
  this.endpointName = '';
  this.synchronous = true;
  this.request = 'checkSession';
};

CheckSession.prototype.init = function(httpLib, keyJar, clientAuthnMethod) {
  httpLib = httpLib || null;
  keyJar = keyJar || null;
  clientAuthnMethod = clientAuthnMethod || null;
  Service.init(httpLib, keyJar, clientAuthnMethod);
  this.preConstruct = [this.oicPreConstruct];
};

CheckSession.prototype.oicPreConstruct = function(
    cliInfo, requestArgs, kwargs) {
  requestArgs = requestArgs || null;
  requestArgs = this.setIdToken(cliInfo, requestArgs, kwargs);
  return requestArgs, {};
};

CheckID.prototype = new Service();
CheckID.prototype = Object.create(Service.prototype);
CheckID.prototype.constructor = CheckID;

function CheckID() {
  this.msgType = oic.CheckIDRequest;
  this.responseCls = Message;
  this.errorMsg = ErrorResponse;
  this.endpointName = '';
  this.synchronous = true;
  this.request = 'checkId';
};

CheckSession.prototype.init = function(httpLib, keyJar, clientAuthnMethod) {
  httpLib = httpLib || null;
  keyJar = keyJar || null;
  clientAuthnMethod = clientAuthnMethod || null;
  ServiceWorker.init(httpLib, keyJar, clientAuthnMethod);
  this.preConstruct = [this.oicPreConstruct];
};

CheckSession.prototype.oicPreConstruct =
    function(cliInfo, requestArgs, kwargs) {
  requestArgs = requestArgs || null;
  requestArgs = this.setIdToken(cliInfo, requestArgs, kwargs);
  var list = [requestArgs, {}];
  return list;
};


EndSession.prototype = new Service();
EndSession.prototype = Object.create(Service.prototype);
EndSession.prototype.constructor = EndSession;

function EndSession() {
  this.msgType = oic.CheckIDRequest;
  this.responseCls = Message;
  this.errorMsg = ErrorResponse;
  this.endpointName = 'endSessionEndpoint';
  this.synchronous = true;
  this.request = 'endSession';
};

EndSession.prototype.init = function(httpLib, keyJar, clientAuthnMethod) {
  httpLib = httpLib || null;
  keyJar = keyJar || null;
  clientAuthnMethod = clientAuthnMethod || null;
  Service.init(httpLib, keyJar, clientAuthnMethod);
  this.preConstruct = [this.oicPreConstruct];
};

EndSession.prototype.oicPreConstruct = function(cliInfo, requestArgs, kwargs) {
  var requestArgs = this.setIdToken(cliInfo, requestArgs, kwargs);
  var list = [requestArgs, {}]
  return list;
};

var OicFactory = function OicFactory(
    reqName, httpLib, keyJar, clientAuthnMethod) {
  for (var i = 0; i < Object.keys(module.exports).length; i++) {
    var key = Object.keys(module.exports)[i];
    var val = module.exports[key];
    if (key === reqName) {
      if (val.prototype.init) {
        val.prototype.init(httpLib, keyJar, clientAuthnMethod);
      }
      return val;
    }
  }
};

module.exports.Authorization = Authorization;
module.exports.AccessToken = AccessToken;
module.exports.RefreshAccessToken = RefreshAccessToken;
module.exports.ProviderInfoDiscovery = ProviderInfoDiscovery;
module.exports.Registration = Registration;
module.exports.UserInfo = UserInfo;
module.exports.CheckSession = CheckSession;
module.exports.CheckID = CheckID;
module.exports.EndSession = EndSession;
module.exports.OicFactory = OicFactory;