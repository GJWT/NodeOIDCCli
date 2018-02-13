const AccessTokenRequest =
    require('../../../oicMsg/oauth2/init.js').AccessTokenRequest;
const AccessTokenResponse =
    require('../../../oicMsg/oauth2/init.js').AccessTokenResponse;
const TokenErrorResponse =
    require('../../../oicMsg/oauth2/init.js').TokenErrorResponse;
const Service = require('../../service.js');
const oauth2Service = require('./service');

class AccessToken extends Service {
  constructor() {
    super();
    this.msgType = AccessTokenRequest;
    this.responseCls = AccessTokenResponse;
    this.errorMsg = TokenErrorResponse;
    this.endpointName = 'authorizationEndpoint';
    this.synchronous = false;
    this.request = 'accessToken';
    this.defaultAuthnMethod = 'clientSecretBasic';
    this.httpMethod = 'POST';
    this.preConstruct = [this.oauthPreConstruct];
    this.postParseResponse.push(oauth2Service.postXParseResponse);
    this.defaultRequestArgs = this.defaultRequestArgs;
  }

  init(httpLib, keyJar, clientAuthnMethod) {
    httpLib = httpLib || null;
    keyJar = keyJar || null;
    clientAuthnMethod = clientAuthnMethod || null;
    super.init(httpLib, keyJar, clientAuthnMethod);
    this.preConstruct = [this.oauthPreConstruct];
    this.msgType = AccessTokenRequest;
  }

  oauthPreConstruct(cliInfo, requestArgs, kwargs) {
    let state = oauth2Service.getState(requestArgs, kwargs);
    let reqArgs =
        cliInfo.stateDb.getResponseArgs(state, new AccessToken().msgType);
    if (requestArgs == null) {
      requestArgs = reqArgs;
    } else {
      for (let i = 0; i < Object.keys(reqArgs).length; i++) {
        let key = Object.keys(reqArgs)[i];
        let val = reqArgs[key];
        requestArgs[key] = val;
      }
    }

    if (Object.keys(requestArgs).indexOf('grant_type') === -1) {
      requestArgs['grant_type'] = 'authorization_code';
    }

    let list = [requestArgs, {}, new AccessToken().msgType];
    return list;
  }
}

module.exports.AccessToken = AccessToken;