const JWSAuthnMethod = require('./jwsAuth').JWSAuthnMethod;

class ClientSecretJWT extends JWSAuthnMethod {
  constructor() {
    super();
  }

  /**
   * More complicated logic then I would have liked it to be
   * @param {*} cis Request class instance
   * @param {*} ci Client information
   * @param {*} requestArgs Request arguments
   * @param {*} httpArgs HTTP header arguments
   * @param {*} kwargs
   */
  chooseAlgorithm(entity, kwargs) {
    entity = entity || 'clientSecretJwt';
    return JWSAuthnMethod.chooseAlgorithm(entity, kwargs);
  }

  getSigningKey(algorithm, cliInfo) {
    alg = alg || algorithm;
    return cliInfo.keyjar.getSigningKey(alg2keyType(algorithm), '', alg);
  }
}

module.exports.ClientSecretJWT = ClientSecretJWT;