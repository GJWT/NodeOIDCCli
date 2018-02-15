/**
 * @fileoverview One of the six different client authentication / authorization
 * methods supported by OICCli that adds the corresponding authentication
 * information to the request.
 */

const ClientAuthnMethod = require('./clientAuth').ClientAuthnMethod;

class BearerHeader extends ClientAuthnMethod {
  constructor() {
    super();
  }

  /**
   * @param {?ResourceRequest} cis Request class instance
   * @param {?ClientInfo} ci Client information
   * @param {?Object.<string, string>} requestArgs Request arguments
   * @param {?Object.<string, string>} httpArgs HTTP header arguments
   * @param {?Object.<string, string>} kwargs Other optional arguments
   */
  construct(cis, cliInfo, httpArgs, kwargs) {
    cis = cis || null;
    cliInfo = cliInfo || null;
    httpArgs = httpArgs || null;

    const origCis = cis;
    let accToken = null;
    if (cis !== null) {
      if (cis.access_token) {
        accToken = cis.access_token;
        delete cis.access_token;
      } else {
        if (kwargs && kwargs.access_token) {
          accToken = kwargs.access_token;
        } else {
          accToken = cliInfo.stateDb.getTokenInfo(kwargs).access_token;
        }
      }
    } else {
      try {
        accToken = kwargs.access_token;
      } catch (err) {
        console.log(err);
      }
    }

    const bearer = 'Bearer ' + accToken;
    if (httpArgs == null) {
      httpArgs = {headers: {}};
      httpArgs.headers.Authorization = bearer;
    } else {
      try {
        httpArgs.headers.Authorization = bearer;
      } catch (err) {
        httpArgs.headers = {Authorization: bearer};
      }
    }
    return httpArgs;
  }
}

module.exports.BearerHeader = BearerHeader;