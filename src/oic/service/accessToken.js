const OAuth2AccessToken =
    require('../../oauth2/service/accessToken').AccessToken;

class AccessToken extends OAuth2AccessToken {
  constructor() {
    super();
  }

  /**
   * @param {*} cis Request class instance
   * @param {*} requestArgs Request arguments
   * @param {*} httpArgs HTTP arguments
   */
  init(httpLib, keyJar, clientAuthnMethod) {
    httpLib = httpLib || null;
    keyJar = keyJar || null;
    clientAuthnMethod = clientAuthnMethod || null;
    super.init(httpLib, keyJar, clientAuthnMethod);
    this.postParseResponse = [this.oicPostParseResponse];
  }

  oicPostParseResponse(resp, cliInfo, state, kwargs) {
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
  }
}

module.exports.AccessToken = AccessToken;