/**
 * @fileoverview One of the six different client authentication / authorization
 * methods supported by OICCli that adds the corresponding authentication
 * information to the request.
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
    if (kwargs) {
      passwd = kwargs.password;
    } else {
      if (httpArgs.password) {
        passwd = httpArgs.password;
      } else {
        if (cis.client_secret) {
          passwd = cis.client_secret;
        } else {
          passwd = cliInfo.client_secret;
        }
      }
    }
    
    let user = null;
    if (kwargs) {
      user = kwargs.user;
    } else {
      user = cliInfo.client_id;
    }
    httpArgs.headers = httpArgs.headers || {};
    const credentials = {};
    credentials[user] = passwd;
    httpArgs.headers['Authorization'] = credentials;
    try {
      delete cis.client_secret;
    } catch (err) {
      console.log(err);
    }
    if (cis.grant_type === 'authorization_code') {
      if (!cis.client_id) {
        if (cliInfo.client_id) {
          cis.client_id = cliInfo.client_id;
        } else {
          return;
        }
      }
    } else {
      let req = null;
      if (cis.client_id) {
        req = cis.client_id;
      } else {
        req = false;
      }

      if (!req) {
        try {
          delete cis.client_id;
        } catch (err) {
          console.log(err);
        }
      }
    }
    return httpArgs;
  }
}

module.exports.ClientSecretBasic = ClientSecretBasic;