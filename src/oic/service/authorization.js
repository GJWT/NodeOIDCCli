const OAuth2Authorization =
    require('../../oauth2/service/authorization').Authorization;

class Authorization extends OAuth2Authorization {
  /**
   * @param {*} cis Request class instance
   * @param {*} requestArgs Request arguments
   * @param {*} httpArgs HTTP arguments
   */
  init(httpLib, keyJar, clientAuthnMethod) {
    super.init(httpLib, keyJar, clientAuthnMethod);
    this.defaultRequestArgs = {'scope': ['openId']};
    this.preConstruct = [this.oicPreConstruct];
    this.postConstruct = [this.oicPostConstruct];
  }

  oicPreConstruct(cliInfo, requestArgs, kwargs) {
    let rt = null;
    if (requestArgs != null) {
      rt = requestArgs['response_type'];
      if (rt.indexOf('token') !== -1 || rt.indexOf('idToken') !== -1) {
        if (Object.keys(requestArgs).indexOf('nonce') !== -1) {
          requestArgs['nonce'] = Math.random().toString(36).substring(32);
        }
      }
    } else {
      requestArgs = {'nonce': Math.random().toString(36).substring(32)};
    }

    let postArgs = {};

    let attributes = ['request_object_signing_alg', 'algorithm', 'sig_kid'];
    for (let i = 0; i < attributes.length; i++) {
      let attr = attributes[i];
      try {
        postArgs[attr] = kwargs[attr];
      } catch (err) {
      }
      if (kwargs && kwargs[attr]) {
        delete kwargs[attr];
      }
    }

    if (kwargs && kwargs.indexOf('requestMethod') !== -1) {
      if (kwargs['requestMethod'] == 'reference') {
        postArgs['requestParam'] = 'requestUri';
      } else {
        postArgs['requestParam'] = 'request';
      }
      delete kwargs['requestMethod'];
    }

    let responseMod = null;
    try {
      responseMod = cliInfo.behavior['response_mode'];
    } catch (err) {
    }
    if (responseMod == 'formPost') {
      requestArgs['response_mode'] = responseMod;
    }

    let list = [requestArgs, postArgs];
    return list;
  }

  oicPostConstruct(cliInfo, req, kwargs) {
    if (req['scope'].indexOf('openId') !== -1) {
      let responseType = req['response_type'][0];
      if (responseType.indexOf('id_token') !== -1 ||
          responseType.indexOf('code') !== -1) {
        if (Object.keys(req).indexOf('nonce') === -1) {
          let nonce = Math.random().toString(36).substring(2);
          req['nonce'] = nonce;
          cliInfo.stateDb.bindNonceToState(nonce, req['state']);
        }
      }
    } else {
      let requestParam = null;
      try {
        requestParam = kwargs['request_param'];
      } catch (err) {
        return req;
      }
      delete kwargs['request_param'];

      let alg = null;

      let args = ['request_object_signing_alg', 'algorithm'];
      for (let i = 0; i < args.length; i++) {
        let arg = args[i];
        try {
          alg = kwargs[arg];
        } catch (err) {
          console.log(err);
        }
      }

      if (!alg) {
        try {
          alg = cliInfo.behavior['request_object_signing_alg'];
        } catch (err) {
          alg = 'RS256';
        }
      }

      kwargs['request_object_signing_alg'] = alg;

      if (Object.keys(kwargs).indexOf('keys') === -1 && alg && alg !== null) {
        kty = jws.alg2keyType(alg);
        try {
          kid = kwargs['sigKid'];
        } catch (err) {
          kid = cliInfo.kid['sig'].get(kty, null);
        }

        kwargs['keys'] = cliInfo.keyJar.getSigningKey(kty, kid);
      }

      if (requestParam == 'request') {
        req['request'] = req;
      } else {
        let webName = null;
        let fileName = null;
      }
    }
    return req;
  }
}

module.exports.Authorization = Authorization;