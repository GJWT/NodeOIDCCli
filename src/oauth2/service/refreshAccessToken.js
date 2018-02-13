const oauth2 = require('../../../oicMsg/oauth2/init.js');
const Service = require('../../service.js');
const oauth2Service = require('./service');

class RefreshAccessToken extends Service {
  constructor() {
    super();
    this.preConstruct = [this.oauthPreConstruct];
    this.msgType = oauth2.RefreshAccessTokenRequest;
    this.responseCls = oauth2.AccessTokenResponse;
    this.errorMsg = oauth2.TokenErrorResponse;
    this.endpointName = 'token_endpoint';
    this.synchronous = true;
    this.request = 'refresh_token';
    this.defaultAuthnMethod = 'bearer_header';
    this.httpMethod = 'POST';
  }

  init(httpLib, keyJar, clientAuthnMethod) {
    httpLib = httpLib || null;
    keyJar = keyJar || null;
    clientAuthnMethod = clientAuthnMethod || null;
    super.init(httpLib, keyJar, clientAuthnMethod);
    this.preConstruct = [this.oauthPreConstruct];
    this.msgType = oauth2.RefreshAccessTokenRequest;
  }

  oauthPreConstruct(cliInfo, requestArgs, kwargs) {
    let state = oauth2Service.getState(requestArgs, kwargs);
    let reqArgs = cliInfo.stateDb.getResponseArgs(
        state, new RefreshAccessToken().msgType);
    if (requestArgs == null) {
      requestArgs = reqArgs;
    } else {
      for (let i = 0; i < Object.keys(reqArgs).length; i++) {
        let key = Object.keys(reqArgs)[i];
        let val = reqArgs[key]
        requestArgs[key] = val;
      }
    }
    let list = [requestArgs, {}];
    return list;
  }
}

module.exports.RefreshAccessToken = RefreshAccessToken;