const OAuth2RefreshAccessToken =
    require('../../oauth2/service/refreshAccessToken').RefreshAccessToken;
const oicMsgOic = require('../../../nodeOIDCMsg/src/oicMsg/oic/init');

/**
 * RefreshAccessToken
 * @class
 * @constructor
 * @extends OAuth2RefreshAccessToken
 */
class RefreshAccessToken extends OAuth2RefreshAccessToken {
  /**
   * @param {ServiceContext} serviceContext Contains information that a client needs to be able to talk to a server
   * @param {DB} stateDb DB class instance
   * @param {string} clientAuthnMethod One of the six client authentication methods : bearer_body, bearer_header, client_secret_basic, 
   * client_secret_jwt, client_secret_post, private_key_jwt 
   * @param {Object.<string, string>} conf Client configuration that contains information such as client Metadata
   */
  constructor(serviceContext, stateDb, clientAuthnMethod=null, conf=null) {
    super(serviceContext, stateDb, clientAuthnMethod, conf);
    this.msgType = oicMsgOic.RefreshAccessTokenRequest;
    this.responseCls = oicMsgOic.AccessTokenResponse;
    this.errorMsg = oicMsgOic.TokenErrorResponse;
  }
}

module.exports.RefreshAccessToken = RefreshAccessToken;