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
   *@param {*} cis Request class instance
   *@param {*} ci Client information
   *@param {*} requestArgs Request arguments
   *@param {*} httpArgs HTTP header arguments
   *@param {*} kwargs
   */
  construct(cis, cliInfo, requestArgs, httpArgs, kwargs) {
    if (requestArgs === null) {
      requestArgs = {};
    }

    if (Object.keys(cis).indexOf('access_token') !== -1) {
      return;
    } else {
      if (requestArgs['access_token']) {
        cis['access_token'] = requestArgs['access_token'];
      } else {
        if (!kwargs && !cliInfo.state) {
          console.log('Missing state specification');
        }
        kwargs['state'] = cliInfo.state;
        cis['access_token'] =
            cliInfo.stateDb.getTokenInfo(kwargs)['access_token'];
      }
    }
    let list = [httpArgs, cis];
    return list;
  }

  bearerAuth(req, authn) {
    try {
      return req['access_token'];
    } catch (err) {
      assert.isTrue(authn.startsWith('Bearer '));
      return authn.substring(7, authn.length - 1);
    }
  }
}

module.exports.BearerBody = BearerBody;