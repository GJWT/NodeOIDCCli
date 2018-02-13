const oauth2 = require('../../../oicMsg/oauth2/init.js');
const Service = require('../../service.js');
const oauth2Service = require('./service');

class Authorization extends Service {
  constructor() {
    super();
    this.msgType = oauth2.AuthorizationRequest;
    this.responseCls = oauth2.AuthorizationResponse;
    this.errorMsg = oauth2.AuthorizationErrorResponse;
    this.endpointName = 'authorizationEndpoint';
    this.synchronous = false;
    this.request = 'authorization';
    this.preConstruct = [this.oauthPreConstruct];
    this.postParseResponse.push(oauth2Service.postXParseResponse);
  }

  init(httpLib, keyJar, clientAuthnMethod) {
    httpLib = httpLib || null;
    keyJar = keyJar || null;
    clientAuthnMethod = clientAuthnMethod || null;
    super.init(httpLib, keyJar, clientAuthnMethod);
    this.preConstruct = [this.oauthPreConstruct];
    this.msgType = oauth2.AuthorizationRequest;
  }

  oauthPreConstruct(cliinfo, requestArgs, kwargs) {
    let self = this;
    let latest = null;
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

    requestArgs['state'] = oauth2Service.getState(requestArgs, kwargs);
    let list = [requestArgs, {}];
    return list;
  }

  gatherRequestArgs(cliInfo, kwargs) {
    let arArgs = this.parseArgs(cliInfo, kwargs);
    if (Object.keys(arArgs).indexOf('redirect_uri') === -1) {
      try {
        arArgs['redirect_uri'] = cliInfo.redirectUris[0];
      } catch (err) {
        console.log(err);
        console.log('Missing parameter redirect uri');
      }
    }
    return arArgs;
  }

  doRequestInit(
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

    let info = Service.doRequestInit(
        cliInfo, bodyType, method, authnMethod, requestArgs, httpArgs, kwargs);

    info['algs'] = algs;
    return info;
  }
}

module.exports.Authorization = Authorization;