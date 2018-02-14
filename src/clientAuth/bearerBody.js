/**
 * @fileoverview One of the six different client authentication / authorization
 * methods supported by OICCli that adds the corresponding authentication
 * information to the request.
 */

const ClientAuthnMethod = require('./clientAuth').ClientAuthnMethod;

const SINGLE_OPTIONAL_STRING = (String, false, null, null, false);

class BearerBody extends ClientAuthnMethod {
  constructor() {
    super();
  }

  /**
   * @param {?ResourceRequest} cis Request class instance
   * @param {?ClientInfo} cliInfo Client information
   * @param {?Object.<string, string>} requestArgs Request arguments
   * @param {?Object.<string, string>} httpArgs HTTP header arguments
   * @param {?Object.<string, string>} kwargs Other extra arguments
   */
  construct(cis, cliInfo, requestArgs, httpArgs, kwargs) {
    if (requestArgs === null) {
      requestArgs = {};
    }

    if (cis.access_token) {
      return;
    } else {
      if (requestArgs.access_token) {
        cis.access_token = requestArgs.access_token;
      } else {
        if (!kwargs && !cliInfo.state) {
          console.log('Missing state specification');
        }
        kwargs.state = cliInfo.state;
        cis.access_token =
            cliInfo.stateDb.getTokenInfo(kwargs)['access_token'];
      }
    }
    const list = [httpArgs, cis];
    return list;
  }

  bearerAuth(req, authn) {
    try {
      return req.access_token;
    } catch (err) {
      assert.isTrue(authn.startsWith('Bearer '));
      return authn.substring(7, authn.length - 1);
    }
  }
}

module.exports.BearerBody = BearerBody;