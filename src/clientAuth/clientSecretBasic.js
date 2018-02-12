const ClientAuthnMethod = require('./clientAuth').ClientAuthnMethod;

class ClientSecretBasic extends ClientAuthnMethod {
  constructor() {
    super();
  }

  /**
   * @param {*} cis Request class instance
   * @param {*} requestArgs Request arguments
   * @param {*} httpArgs HTTP arguments
   */
  construct(cis, cliInfo, requestArgs, httpArgs, kwargs) {
    cliInfo = cliInfo || null;
    requestArgs = requestArgs || null;
    httpArgs = httpArgs || null;

    if (httpArgs == null) {
      httpArgs = {};
    }
    let passwd = null;
    if (kwargs) {
      passwd = kwargs['password'];
    } else {
      if (httpArgs['password']) {
        passwd = httpArgs['password'];
      } else {
        if (cis['client_secret']) {
          passwd = cis['client_secret'];
        } else {
          passwd = cliInfo.client_secret;
        }
      }
    }

    let user = null;
    if (kwargs) {
      user = kwargs['user'];
    } else {
      user = cliInfo.client_id;
    }
    if (Object.keys(httpArgs).indexOf('headers') === -1) {
      httpArgs['headers'] = {};
    }
    let credentials = {};
    credentials[user] = passwd;
    httpArgs['headers']['Authorization'] = credentials;
    try {
      delete cis['client_secret'];
    } catch (err) {
      console.log('KeyError');
    }
    if (cis['grant_type'] === 'authorization_code') {
      if (Object.keys(cis).indexOf('client_id') === -1) {
        try {
          cis['client_id'] = cliInfo.client_id;
        } catch (err) {
          return;
        }
      }
    } else {
      let req = null;
      if (cis['client_id']) {
        req = cis['client_id'];
      } else {
        req = false;
      }

      if (!req) {
        try {
          delete cis['client_id'];
        } catch (err) {
          console.log(err);
        }
      }
    }
    return httpArgs;
  }
}

module.exports.ClientSecretBasic = ClientSecretBasic;