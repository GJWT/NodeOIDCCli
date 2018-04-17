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
  constructor(serviceContext, stateDb, clientAuthnMethod=null, conf=null) {
    super(serviceContext, stateDb, clientAuthnMethod, conf);
    this.msgType = oicMsgOic.RefreshAccessTokenRequest;
    this.responseCls = oicMsgOic.AccessTokenResponse;
    this.errorMsg = oicMsgOic.TokenErrorResponse;
  }
}

module.exports.RefreshAccessToken = RefreshAccessToken;