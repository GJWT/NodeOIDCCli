const ClientSecretBasic = require('./clientSecretBasic').ClientSecretBasic;

class ClientSecretPost extends ClientSecretBasic {
  constructor() {
    super();
  }

  /**
   * @param {*} cis Request class instance
   * @param {*} requestArgs: Request arguments
   * @param {*} httpArgs: HTTP arguments
   */
  construct(cis, cliInfo, requestArgs, httpArgs, kwargs) {
    if (Object.keys(cis).indexOf('client_secret')) {
      try {
        cis['client_secret'] = httpArgs['client_secret'];
        delete httpArgs['client_secret'];
      } catch (err) {
        if (cliInfo.client_secret) {
          cis['client_secret'] = cliInfo.client_secret;
        } else {
          console.log('Missing client secret');
        }
      }
    }

    cis['client_id'] = cliInfo.client_id;
    let list = [httpArgs, cis];
    return list;
  }
}

module.exports.ClientSecretPost = ClientSecretPost;