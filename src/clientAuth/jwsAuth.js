const ClientAuthnMethod = require('./clientAuth').ClientAuthnMethod;

class JWSAuthnMethod extends ClientAuthnMethod {
  constructor() {
    super();
  }

  /**
   * More complicated logic then I would have liked it to be
   * @param {*} cis Request class instance
   * @param {*} ci Client information
   * @param {*} requestArgs request arguments
   * @param {*} httpArgs HTTP header arguments
   * @param {*} kwargs
   */
  chooseAlgorithm(entity, kwargs) {
    try {
      algorithm = kwargs['algorithm'];
    } catch (err) {
      algorithm = DEF_SIGN_ALG[entity];
    }

    if (!algorithm) {
      console.log('Missing algorithm specification');
    }
    return algorithm;
  }

  getSigningKey(algorithm, cliInfo) {
    alg = alg || algorithm;
    return cliInfo.keyjar.getSigningKey(alg2keyType(algorithm), alg);
  }

  getKeyByKid(kid, algorithm, cliInfo) {
    let key = cliInfo.keyjar.getKeyByKid(kid);
    if (key) {
      ktype = alg2keyType(algorithm);
      try {
        assert.deepEqual(key.kty, ktype);
      } catch (err) {
        console.log('Wrong key type');
      }
      return key;
    } else {
      console.log('No key with kid');
    }
  }

  /**
   * Constructs a client assertion and signs it with a key.
   * The request is modified as a side effect.
   * @param {*} cis The request
   * @param {*} requestArgs Request arguments
   * @param {*} httpArgs HTTP arguments
   * @param {*} kwargs Extra arguments
   */
  construct(cis, cliInfo, requestArgs, httpArgs, kwargs) {
    if (kwargs.indexOf('clientAssertion') !== -1) {
      cis['clientAssertionType'] = kwargs['clientAssertion'];
      if (kwargs.indexOf('clientAssertionType') !== -1) {
        cis['clientAssertionType'] = kwargs['clientAssertionType'];
      } else {
        cis['clientAssertionType'] = JWTBEARER;
      }
    } else if (cis.indexOf('clientAssertion') !== -1) {
      if (cis.indexOf('clientAssertionType') !== -1) {
        cis['clientAssertionType'] = JWT_BEARER;
      }
    } else {
      algorithm = null;
      let tokenInfo = ['token', 'refresh'];
      if (tokenInfo.indexOf(kwargs['authEndpoint'])) {
        try {
          algorithm = cliInfo.registrationInfo['tokenEndpointAuthSigningAlg'];
        } catch (err) {
          return;
        }
        audience = cliInfo.providerInfo['tokenEndpoint'];
      } else {
        audience = cliInfo.providerInfo['issuer'];
      }

      if (!algorithm) {
        algorithm = this.chooseAlgorithm(kwargs);
      }
      ktype = alg2keyType(algorithm);
      let signingKey = null;
      try {
        if (kwargs.indexOf('kid')) {
          signingKey = [this.getKeyByKid(kwargs['kid'], algorithm, cliInfo)];
        } else if (cliInfo.kid['sig'].indexOf(ktype)) {
          try {
            signingKey =
                this.getKeyByKid(cliInfo.kid['sig'][ktype], algorithm, cliInfo);
          } catch (err) {
            signingKey = this.getSigningKey(algorithm, cliInfo);
          }
        } else {
          signingKey = this.getSigningKey(algorithm, cliInfo);
        }
      } catch (err) {
        console.log('No Matching Key');
      }

      try {
        args = {'lifetime': kwargs['lifetime']};
      } catch (err) {
        args = {};
      }
      cis['clientAssertion'] =
          assertionJwt(cliInfo.clientId, signingKey, audience, algorithm, args);
      cis['clientAssertionType'] = JWTBEARER;
    }
    try {
      delete cis['clientSecret'];
    } catch (err) {
      console.log('KeyError');
    }
    if (!cis.cParam['clientId'][VREQUIRED]) {
      try {
        delete cis['clientId'];
      } catch (err) {
        console.log('KeyError');
      }
    }
    return {};
  }
}

module.exports.JWSAuthnMethod = JWSAuthnMethod;