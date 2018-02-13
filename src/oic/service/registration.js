const Service = require('../../service');

class Registration extends Service {
  constructor() {
    super();
    this.msgType = oic.RegistrationRequest;
    this.responseCls = oic.RegistrationResponse;
    this.errorMsg = ErrorResponse;
    this.endpointName = 'registrationEndpoint';
    this.synchronous = true;
    this.request = 'registration';
    this.bodyType = 'json';
    this.httpMethod = 'POST';
    this.postParseResponse.push(this.oicPostParseResponse);
  }

  init(httpLib, keyJar, clientAuthnMethod) {
    httpLib = httpLib || null;
    this.preConstruct = [this.oicPreConstruct];
  }

  /**
   * Create a registration request
   * @param {*} kwargs Parameters to the registration request
   */
  oicPreConstruct(cliInfo, requestArgs, kwargs) {
    for (let i = 0; i < this.msgType.cParam.keys().length; i++) {
      let prop = this.msgType.cParam.keys()[i];
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
  }

  oicPostParseResponse(resp, cliInfo, kwargs) {
    cliInfo.registrationResponse = resp;
    if (cliInfo.registrationResponse.indexOf('tokenEndpointAuthnMethod') ===
        -1) {
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
  }
}

module.exports.Registration = Registration;