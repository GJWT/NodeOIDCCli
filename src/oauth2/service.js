var AccessTokenRequest =
require('../../oicMsg/oauth2/init.js').AccessTokenRequest;
var AccessTokenResponse =
require('../../oicMsg/oauth2/init.js').AccessTokenResponse;
var AuthorizationRequest =
require('../../oicMsg/oauth2/init.js').AuthorizationRequest;
var oauth2 = require('../../oicMsg/oauth2/init.js');
var Service = require('../service.js');
var TokenErrorResponse =
    require('../../oicMsg/oauth2/init.js').TokenErrorResponse;

function postXParseResponse(resp, cliInfo, state) {
  state = state || '';
  cliInfo.stateDb.addResponse(resp, state);
};

function getState(requestArgs, kwargs) {
  var state = null;
  if (kwargs && kwargs['state']) {
    state = kwargs['state'];
  } else {
    if (requestArgs['state']) {
      state = requestArgs['state'];
    }
  }
  return state;
};

Authorization.prototype = new Service();
Authorization.prototype = Object.create(Service.prototype);
Authorization.prototype.constructor = Authorization;

function Authorization() {
  Service.call(this);
};

Authorization.prototype.msgType = oauth2.AuthorizationRequest;
Authorization.prototype.responseCls = oauth2.AuthorizationResponse;
Authorization.prototype.errorMsg = oauth2.AuthorizationErrorResponse;
Authorization.prototype.endpointName = 'authorizationEndpoint';
Authorization.prototype.synchronous = false;
Authorization.prototype.request = 'authorization';
Authorization.prototype.preConstruct =
    [Authorization.prototype.oauthPreConstruct];

Authorization.prototype.init = function(httpLib, keyJar, clientAuthnMethod) {
  httpLib = httpLib || null;
  keyJar = keyJar || null;
  clientAuthnMethod = clientAuthnMethod || null;
  Service.call(httpLib, keyJar, clientAuthnMethod);
  this.preConstruct = [this.oauthPreConstruct];
  this.msgType = oauth2.AuthorizationRequest;
  this.postParseResponse.push(postXParseResponse);
};

Authorization.prototype.oauthPreConstruct = function(
    cliinfo, requestArgs, kwargs) {
  var latest = null;
  if (requestArgs !== null) {
    try {
      latest = requestArgs['redirect_uri'];
      if (latest) {
        this.redirectUris = [latest];
      }
    } catch (err) {
      console.log(err);
    }
  } else {
    requestArgs = {};
  }

  requestArgs['state'] = getState(requestArgs, kwargs);
  var list = [requestArgs, {}];
  return list;
};

Authorization.prototype.gatherRequestArgs = function(cliInfo, kwargs) {
  var arArgs = this.parseArgs(cliInfo, kwargs);
  if (Object.keys(arArgs).indexOf('redirect_uri') === -1) {
    try {
      arArgs['redirect_uri'] = cliInfo.redirectUris[0];
    } catch (err) {
      console.log(err);
      console.log('Missing parameter redirect uri');
    }
  }
  return arArgs;
};

Authorization.prototype.doRequestInit = function(
    cliinfo, bodyType, method, authnMethod, requestArgs, httpArgs, kwargs) {
  bodyType = bodyType || '';
  method = method || 'GET';
  authnMethod = authnMethod || '';
  requestArgs = requestArgs || null;
  httpArgs = httpArgs || null;

  try {
    algs = kwargs['algs'];
  } catch (err) {
    algs = {};
  }
  delete kwargs['algs'];

  var info = Service.doRequestInit(
      cliInfo, bodyType, method, authnMethod, requestArgs, httpArgs, kwargs);

  info['algs'] = algs;
  return info;
};

AccessToken.prototype = Object.create(Service.prototype);
AccessToken.prototype.constructor = AccessToken;

function AccessToken() {
  Service.call(this);
};

AccessToken.prototype.msgType = AccessTokenRequest;
AccessToken.prototype.responseCls = AccessTokenResponse;
AccessToken.prototype.errorMsg = TokenErrorResponse;
AccessToken.prototype.endpointName = 'authorizationEndpoint';
AccessToken.prototype.synchronous = false;
AccessToken.prototype.request = 'accessToken';
AccessToken.prototype.defaultAuthnMethod = 'clientSecretBasic';
AccessToken.prototype.httpMethod = 'POST';
AccessToken.prototype.preConstruct = [AccessToken.prototype.oauthPreConstruct];

AccessToken.prototype.init = function(httpLib, keyJar, clientAuthnMethod) {
  httpLib = httpLib || null;
  keyJar = keyJar || null;
  clientAuthnMethod = clientAuthnMethod || null;
  Service.call(httpLib, keyJar, clientAuthnMethod);
  this.preConstruct = [this.oauthPreConstruct];
  this.msgType = AccessTokenRequest;
  this.postParseResponse.push(postXParseResponse);
  ;
};

AccessToken.prototype.oauthPreConstruct = function(
    cliInfo, requestArgs, kwargs) {
  var state = getState(requestArgs, kwargs);
  var reqArgs = cliInfo.stateDb.getResponseArgs(
      state, new AccessToken.prototype.msgType());
  if (requestArgs == null) {
    requestArgs = reqArgs;
  } else {
    for (var i = 0; i < Object.keys(reqArgs).length; i++) {
      var key = Object.keys(reqArgs)[i];
      var val = reqArgs[key];
      requestArgs[key] = val;
    }
  }

  if (Object.keys(requestArgs).indexOf('grant_type') === -1) {
    requestArgs['grant_type'] = 'authorization_code';
  }

  var list = [requestArgs, {}, new AccessToken.prototype.msgType()];
  return list;
};


RefreshAccessToken.prototype = new Service();
RefreshAccessToken.prototype = Object.create(Service.prototype);
RefreshAccessToken.prototype.constructor = RefreshAccessToken;
RefreshAccessToken.prototype.preConstruct = [this.oauthPreConstruct];

function RefreshAccessToken() {};

RefreshAccessToken.prototype.msgType = oauth2.RefreshAccessTokenRequest;
RefreshAccessToken.prototype.responseCls = oauth2.AccessTokenResponse;
RefreshAccessToken.prototype.errorMsg = oauth2.TokenErrorResponse;
RefreshAccessToken.prototype.endpointName = 'token_endpoint';
RefreshAccessToken.prototype.synchronous = true;
RefreshAccessToken.prototype.request = 'refresh_token';
RefreshAccessToken.prototype.defaultAuthnMethod = 'bearer_header';
RefreshAccessToken.prototype.httpMethod = 'POST';

RefreshAccessToken.prototype.init = function(
    httpLib, keyJar, clientAuthnMethod) {
  httpLib = httpLib || null;
  keyJar = keyJar || null;
  clientAuthnMethod = clientAuthnMethod || null;
  Service.call(httpLib, keyJar, clientAuthnMethod);
  this.preConstruct = [this.oauthPreConstruct];
  this.msgType = oauth2.RefreshAccessTokenRequest;
};

RefreshAccessToken.prototype.oauthPreConstruct = function(
    cliInfo, requestArgs, kwargs) {
  var state = getState(requestArgs, kwargs);
  var reqArgs = cliInfo.stateDb.getResponseArgs(
      state, new RefreshAccessToken.prototype.msgType());

  if (requestArgs == null) {
    requestArgs = reqArgs;
  } else {
    for (var i = 0; i < Object.keys(reqArgs).length; i++) {
      var key = Object.keys(reqArgs)[i];
      var val = reqArgs[key]
      requestArgs[key] = val;
    }
  }
  var list = [requestArgs, {}];
  return list;
};

ProviderInfoDiscovery.prototype = new Service();
ProviderInfoDiscovery.prototype = Object.create(Service.prototype);
ProviderInfoDiscovery.prototype.constructor = ProviderInfoDiscovery;

function ProviderInfoDiscovery() {};
ProviderInfoDiscovery.prototype.msgType = oauth2.Message;
ProviderInfoDiscovery.prototype.responseCls = oauth2.ASConfigurationResponse;
ProviderInfoDiscovery.prototype.errorMsg = oauth2.ErrorResponse;
ProviderInfoDiscovery.prototype.synchronous = true;
ProviderInfoDiscovery.prototype.request = 'provider_info';
ProviderInfoDiscovery.prototype.httpMethod = 'GET';

ProviderInfoDiscovery.prototype.init = function(
    httpLib, keyJar, clientAuthnMethod) {
  Service.prototype.init(httpLib, keyJar, clientAuthnMethod);
  this.postParseResponse.push(this.oauthPostParseResponse);
  this.msgType = oauth2.Message;
};

ProviderInfoDiscovery.prototype.requestInfo = function(
    cliInfo, method, requestArgs, lax, kwargs) {
  method = method || 'GET';
  requestArgs = requestArgs || null;
  lax = lax || false;

  this.issuer = cliInfo.issuer;
  var issuerUpdated = null;
  if (issuer.endsWith('/')) {
    var splitIssuer = issuer.split('');
    var reversedIssuer = splitIssuer.reverse();
    var joinedIssuer = reversedIssuer.join('');
    issuerUpdated = joinedIssuer;
  } else {
    issuerUpdated = issuer;
  }
  return {'uri': OIDCONF_PATTERN % issuer};
};

/**
 * Deal with Provider Config Response
 * :param resp: The provider info response
 * :param cli_info: Information about the client/server session
 */
ProviderInfoDiscovery.prototype.oauthPostParseResponse = function(
    resp, cliInfo, kwargs) {
  var issuer = cliInfo.issuer;
  var pcrIssuer = null;
  if (Object.keys(resp).indexOf(issuer) !== -1) {
    var pcrIssuer = resp['issuer'];
    var issuerUpdated = null;
    if (resp['issuer'].endsWith('/')) {
      if (issuer.endsWith('/')) {
        issuerUpdated = issuer;
      } else {
        issuerUpdated = issuer + '/';
      }
    } else {
      if (issuer.endsWith('/')) {
        var splitIssuer = issuer.split('');
        var reversedIssuer = splitIssuer.reverse();
        var joinedIssuer = reversedIssuer.join('');
        issuerUpdated = joinedIssuer;
      } else {
        issuerUpdated = issuer;
      }
    }

    try {
      cliinfo.allow['issuerMismatch'];
    } catch (err) {
      try {
        assert.deepEquals(issuer, pcrIssuer);
      } catch (err) {
        console.log('Provider info issuer mismatch');
      }
    }
  } else {
    pcrIssuer = issuer;
  }

  cliInfo.issuer = pcrIssuer;
  cliInfo.providerInfo = resp;

  for (var i = 0; i < Object.keys(resp).length; i++) {
    var key = Object.keys(resp)[i];
    var val = resp[key];
    if (key.endsWith('endpoint')) {
      for (var i = 0; i < cliInfo.service.values().length; i++) {
        if (srv.endpointName == key) {
          srv.endpoint = val;
        }
      }
    }
  }

  if (cliInfo.keyjar) {
    kj = cliInfo.keyjar;
  } else {
    kj = new KeyJar();
  }

  // TODO : kj.prototype.loadKeys(resp, pcrIssuer);
  cliInfo.keyJar = kj;
};

var Factory = function Factory(reqName, httpLib, keyJar, clientAuthnMethod) {
  for (var i = 0; i < Object.keys(module.exports).length; i++) {
    var key = Object.keys(module.exports)[i];
    var val = module.exports[key];
    if (key === reqName) {
      val.prototype.init(httpLib, keyJar, clientAuthnMethod);
      return val;
    }
  }
};

module.exports.Authorization = Authorization;
module.exports.AccessToken = AccessToken;
module.exports.RefreshAccessToken = RefreshAccessToken;
module.exports.ProviderInfoDiscovery = ProviderInfoDiscovery;
module.exports.Factory = Factory;