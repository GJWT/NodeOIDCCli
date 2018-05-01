const AccessTokenRequest =
    require('../../../nodeOIDCMsg/src/oicMsg/oauth2/requests').AccessTokenRequest;
const AccessTokenResponse =
    require('../../../nodeOIDCMsg/src/oicMsg/oauth2/responses').AccessTokenResponse;
const TokenErrorResponse =
    require('../../../nodeOIDCMsg/src/oicMsg/oauth2/responses').TokenErrorResponse;
const Service = require('../../service').Service;
const oauth2Service = require('./service');
const AuthorizationRequest =
require('../../../nodeOIDCMsg/src/oicMsg/oauth2/requests').AuthorizationRequest;

/**
 * AccessToken
 * @class
 * @constructor
 * @extends Service
 */
class AccessToken extends Service {
  /**
   * @param {ServiceContext} serviceContext Contains information that a client needs to be able to talk to a server
   * @param {DB} stateDb DB class instance
   * @param {string} clientAuthnMethod One of the six client authentication methods : bearer_body, bearer_header, client_secret_basic, 
   * client_secret_jwt, client_secret_post, private_key_jwt 
   * @param {Object.<string, string>} conf Client configuration that contains information such as client Metadata
   */
  constructor(serviceContext, stateDb, clientAuthnMethod, conf) {
    super(serviceContext, stateDb, clientAuthnMethod, conf);
    this.msgType = AccessTokenRequest;
    this.responseCls = AccessTokenResponse;
    this.errorMsg = TokenErrorResponse;
    this.endpointName = 'token_endpoint';
    this.synchronous = true;
    this.request = 'accessToken';
    this.defaultAuthnMethod = 'client_secret_basic';
    this.httpMethod = 'POST';
    this.bodyType = 'urlEncoded';
    this.responseBodyType = 'json';
    this.preConstruct = [this.oauthPreConstruct];
  }

  updateServiceContext(resp, key='', params){
    this.storeItem(resp, 'token_response', key);
  }

  /* init(httpLib, keyJar, clientAuthnMethod) {
    httpLib = httpLib || null;
    keyJar = keyJar || null;
    clientAuthnMethod = clientAuthnMethod || null;
    super.init(httpLib, keyJar, clientAuthnMethod);
    this.preConstruct = [this.oauthPreConstruct];
    this.msgType = AccessTokenRequest;
  } */

  oauthPreConstruct(requestArgs, request, params) {
    let _state = oauth2Service.getState(requestArgs, params);
    let req = new request.msgType();
    let parameters = Object.keys(req.cParam);
    //let parameters = Object.keys(request.msgType.cParam);
    let _args = request.extendRequestArgs({}, AuthorizationRequest, 'auth_request', _state, parameters);
    _args = request.extendRequestArgs(_args, AuthorizationRequest, 'auth_response', _state, parameters);
    if (Object.keys(_args).indexOf('grant_type') === -1){
      _args['grant_type'] = 'authorization_code';
    }
    
    if (requestArgs == null){
      requestArgs = _args;
    }else{
      _args = Object.assign(requestArgs, _args);
      requestArgs = _args;
    }
    let list = [requestArgs, {}, new AccessToken().msgType];
    return list;
  }
}

module.exports.AccessToken = AccessToken;