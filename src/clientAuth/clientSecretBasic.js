/**
 * @fileoverview One of the six different client authentication / authorization
 * methods supported by OICCli that adds confidential client authentication
 * information to the request header such as a username and password.
 */

const ClientAuthnMethod = require('./clientAuth').ClientAuthnMethod;

class ClientSecretBasic extends ClientAuthnMethod {
  constructor() {
    super();
  }

  /**
   * @param {?ResourceRequest} cis Request class instance
   * @param {?ClientInfo} cliInfo Client information
   * @param {?Object<string, string>} requestArgs Request arguments
   * @param {?Object<string, string>} httpArgs HTTP header arguments
   * @param {?Object<string, string>} kwargs Other extra arguments
   * @return {!Object<string, string>} HTTP header arguments
   */
  construct(cis, cliInfo = null, requestArgs = null, httpArgs = {}, kwargs) {
    httpArgs = httpArgs || {};
    let passwd = null;
    if (kwargs && kwargs.password) {
      passwd = kwargs.password;
    } else {
      if (httpArgs.password) {
        passwd = httpArgs.password;
      } else {
        passwd = cis && cis.client_secret ? cis.client_secret :
                                            cliInfo.client_secret;
      }
    }
    const user = kwargs && kwargs.user ? kwargs.user : cliInfo.client_id;
    const credentials = {};
    credentials[user] = passwd;
    httpArgs.headers = httpArgs.headers || {};
    httpArgs.headers['Authorization'] = credentials;
    if (cis && cis.client_secret) {
      delete cis.client_secret;
    }
    if (cis && cis.grant_type === 'authorization_code') {
      if (!cis.client_id) {
        if (cliInfo.client_id) {
          cis.client_id = cliInfo.client_id;
        } else {
          return;
        }
      }
    } else {
      const req = cis && cis.client_id ? cis.client_id : false
      if (!req && cis && cis.client_id) {
        delete cis.client_id;
      }
    }
    return httpArgs;
  }
}

module.exports.ClientSecretBasic = ClientSecretBasic;