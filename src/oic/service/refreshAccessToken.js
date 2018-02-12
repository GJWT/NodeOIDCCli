const OAuth2RefreshAccessToken =
    require('../../oauth2/service/refreshAccessToken').RefreshAccessToken;
const oicMsgOic = require('../../../oicMsg/oic/init');

class RefreshAccessToken extends OAuth2RefreshAccessToken {
  constructor() {
    super();
    this.msgType = oicMsgOic.RefreshAccessTokenRequest;
    this.responseCls = oicMsgOic.AccessTokenResponse;
    this.errorMsg = oicMsgOic.TokenErrorResponse;
  }
}

module.exports.RefreshAccessToken = RefreshAccessToken;