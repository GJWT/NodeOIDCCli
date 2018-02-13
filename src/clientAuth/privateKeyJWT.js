const JWSAuthnMethod = require('./jwsAuth').JWSAuthnMethod;
const BearerHeader = require('./bearerHeader').BearerHeader;
const ClientSecretBasic = require('./clientSecretBasic').ClientSecretBasic;
const ClientSecretPost = require('./clientSecretPost').ClientSecretPost;
const ClientSecretJWT = require('./clientSecretJWT').ClientSecretJWT;
const BearerBody = require('./bearerBody').BearerBody;
const JWT_BEARER = require('../init.js').OICCli.JWT_BEARER;

class PrivateKeyJWT extends JWSAuthnMethod {
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
    entity = entity || 'privateKeyJwt';
    return JWSAuthnMethod.chooseAlgorithm(entity, kwargs);
  }

  getSigningKey(algorithm, cliInfo) {
    cliInfo = cliInfo || null;
    alg = alg || algorithm;
    return cliInfo.keyjar.getSigningKey(alg2keyType(algorithm), '', alg);
  }
}

let CLIENT_AUTHN_METHOD = {
  'client_secret_basic': ClientSecretBasic,
  'client_secret_post': ClientSecretPost,
  'bearer_header': BearerHeader,
  'bearer_body': BearerBody,
  'client_secret_jwt': ClientSecretJWT,
  'private_key_jwt': PrivateKeyJWT,
};

let TYPE_METHOD = [(JWT_BEARER, JWSAuthnMethod)];

module.exports.PrivateKeyJWT = PrivateKeyJWT;
module.exports.CLIENT_AUTHN_METHOD = CLIENT_AUTHN_METHOD;