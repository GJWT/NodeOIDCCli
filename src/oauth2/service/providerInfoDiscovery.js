const oauth2 = require('../../../oicMsg/oauth2/init.js');
const Service = require('../../service.js');

class ProviderInfoDiscovery extends Service {
  constructor() {
    super();
    this.msgType = oauth2.Message;
    this.responseCls = oauth2.ASConfigurationResponse;
    this.errorMsg = oauth2.ErrorResponse;
    this.synchronous = true;
    this.request = 'provider_info';
    this.httpMethod = 'GET';
    this.postParseResponse.push(this.oauthPostParseResponse);
  }

  init(httpLib, keyJar, clientAuthnMethod) {
    super.init(httpLib, keyJar, clientAuthnMethod);
    this.msgType = oauth2.Message;
  }

  requestInfo(cliInfo, method, requestArgs, lax, kwargs) {
    method = method || 'GET';
    requestArgs = requestArgs || null;
    lax = lax || false;

    this.issuer = cliInfo.issuer;
    let issuerUpdated = null;
    if (issuer.endsWith('/')) {
      let splitIssuer = issuer.split('');
      let reversedIssuer = splitIssuer.reverse();
      let joinedIssuer = reversedIssuer.join('');
      issuerUpdated = joinedIssuer;
    } else {
      issuerUpdated = issuer;
    }
    return {'uri': OIDCONF_PATTERN % issuer};
  }

  /**
   * Deal with Provider Config Response
   * @param {*} resp The provider info response
   * @param {*} cliInfo: Information about the client/server session
   */
  oauthPostParseResponse(resp, cliInfo, kwargs) {
    let issuer = cliInfo.issuer;
    let pcrIssuer = null;
    if (Object.keys(resp).indexOf(issuer) !== -1) {
      let pcrIssuer = resp['issuer'];
      let issuerUpdated = null;
      if (resp['issuer'].endsWith('/')) {
        if (issuer.endsWith('/')) {
          issuerUpdated = issuer;
        } else {
          issuerUpdated = issuer + '/';
        }
      } else {
        if (issuer.endsWith('/')) {
          let splitIssuer = issuer.split('');
          let reversedIssuer = splitIssuer.reverse();
          let joinedIssuer = reversedIssuer.join('');
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
    liInfo.providerInfo = resp;

    for (let i = 0; i < Object.keys(resp).length; i++) {
      let key = Object.keys(resp)[i];
      let val = resp[key];
      if (key.endsWith('endpoint')) {
        for (let i = 0; i < cliInfo.service.values().length; i++) {
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

    cliInfo.keyJar = kj;
  };
}

module.exports.ProviderInfoDiscovery = ProviderInfoDiscovery;