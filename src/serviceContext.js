const crypto = require('crypto');
const KeyJar = require('../nodeOIDCMsg/src/oicMsg/keystore/KeyJar').KeyJar;

const ATTRMAP = {
  'userinfo': {
    'sign': 'userinfo_signed_response_alg',
    'alg': 'userinfo_encrypted_response_alg',
    'enc': 'userinfo_encrypted_response_enc'
  },
  'id_token': {
    'sign': 'id_token_signed_response_alg',
    'alg': 'id_token_encrypted_response_alg',
    'enc': 'id_token_encrypted_response_enc'
  },
  'request': {
    'sign': 'request_object_signing_alg',
    'alg': 'request_object_encryption_alg',
    'enc': 'request_object_encryption_enc'
  }
};

const DEFAULT_SIGN_ALG = {
  'userinfo': 'RS256',
  'request': 'RS384',
  'id_token': 'ES384',
};

/** 
 * This class keeps information that a client needs to be able to talk
 * to a server. Some of this information comes from configuration and some
 * from dynamic provider info discovery or client registration.
 * But information is also picked up during the conversation with a server.
 */
class ServiceContext {
  /**
   * @param {KeyJar} keyjar OIDCMsg KeyJar instance that contains the RP signing and encyrpting keys
   * @param {Object<string, string>} config Client configuration
   * @param {Object<string, string>} params Other attributes that might be needed
   */
  constructor(keyjar, config, params) {
    this.keyjar = keyjar || new KeyJar();
    this.providerInfo = {};
    this.registrationResponse = {};
    this.kid = {'sig': {}, 'enc': {}};
    this.config = config || {};
    let defaultVal = '';

    if (params) {
      for (var i = 0; i < Object.keys(params).length; i++){
        let key = Object.keys(params)[i];
        let val = params[key];
        this[key] = val;
      }
    }
    
    this.client_id = this.config['client_id'] || defaultVal;
    this.issuer = this.config['issuer'] || defaultVal;
    this.client_secret = this.config['client_secret'] || defaultVal;
    this.setClientSecret(this.client_secret);    
    this.base_url = this.config['base_url'] || defaultVal;
    this.request_dir = this.config['requests_dir'] || defaultVal;

    defaultVal = {}
    this.allow = this.config['allow'] || defaultVal;
    this.client_prefs = this.config['client_preferences'] || defaultVal;
    this.behavior = this.config['behaviour'] || defaultVal;
    this.provider_info = this.config['provider_info'] || defaultVal;

    try {
      this.redirectUris = this.config['redirect_uris'];
    } catch (err) {
      this.redirectUris = [null];
    }

    this.callback = this.config['callback'] || {};

    if (config && Object.keys(config).indexOf('keydefs') !== -1) {
      this.keyjar = this.keyjar.buildKeyJar(config['keydefs'], this.keyjar)[1];
    }

    return this;
  }

  getClientSecret() {
    return this.client_secret;
  }

  setClientSecret(val) {
    if (!val) {
      this.client_secret = '';
    } else {
      this.client_secret = val;
      // client uses it for signing
      // Server might also use it for signing which means the
      // client uses it for verifying server signatures
      if (this.keyjar == null) {
        this.keyjar = new KeyJar();
      }
      this.keyjar.addSymmetric('', val.toString());
    }
  }

  /**
   *  Need to generate a redirect_uri path that is unique for a OP/RP combo
   *  This is to counter the mix-up attack.
   * @param {string} path Leading path
   * @return A list of one unique URL
   */
  generateRequestUris(path) {
    let m = crypto.createHmac('sha256', '');
    try {
      m.update(this.providerInfo['issuer']);
    } catch (error) {
      m.update(this.issuer);
    }
    m.update(this.base_url);
    if (!path.startsWith('/')){
      return [this.base_url + '/' + path+ '/' +  m.digest('hex')];
    }else{
      return [this.base_url + path + '/' + m.digest('hex')];
    }
  }

  /**
   *  A 1<->1 map is maintained between a URL pointing to a file and
   * the name of the file in the file system.
   * 
   * As an example if the base_url is 'https://example.com' and a jwks_uri
   * is 'https://example.com/jwks_uri.json' then the filename of the
   * corresponding file on the local filesystem would be 'jwks_uri.json.
   * Relative to the directory from which the RP instance is run.
   * 
   * @param {string} webName 
   */
  filenameFromWebName(webName) {
    if (webName.startsWith(this.base_url) == false){
      console.log('ValueError');
    }
    let name = webName.substring(this.base_url.length, webName.length);
    if (name.startsWith('/')) {
      return name.substring(1, name.length);
    } else {
      let splitName = name.split('/');
      return splitName[splitName.length - 1];
    }
  }

  /**
   * Reformat the crypto algorithm information gathered from a 
   * client registration response into something more palatable.
   * 
   * @param {string} typ: 'id_token', 'userinfo' or 'request_object'
   */
  signEncAlgs(typ) {
    let serviceContext = this;
    let resp = {};
    for (let i = 0; i < Object.keys(ATTRMAP[typ]).length; i++) {
        let key = Object.keys(ATTRMAP[typ])[i];
        let val = ATTRMAP[typ][key];
        if (serviceContext.registrationResponse && serviceContext.registrationResponse[val]){
        resp[key] = serviceContext.registrationResponse[val];
        }else if (key === 'sign') {
        try {
            resp[key] = DEFAULT_SIGN_ALG[typ];
        } catch (err) {
            return;
        }
        }
    }
    return resp;
  }

  /**
   * Verifies that the algorithm to be used are supported by the other side.
   * This will look at provider information either statically configured or 
   * obtained through dynamic provider info discovery.
   * 
   * @param {string} alg The algorithm specification
   * @param {string} usage In which context the 'alg' will be used.
   * The following contexts are supported:
   *        - userinfo
   *        - id_token
   *        - request_object
   *        - token_endpoint_auth
   * @param {string} typ Type of alg
   *        - signing_alg 
   *        - encryption_alg
   *        - encryption_enc
   */
  verifyAlgSupport(alg, usage, typ) {
    let serviceContext = this;
    let supported = serviceContext.providerInfo[usage + '_' + typ + '_values_supported'];
    if (supported.indexOf(alg) !== -1) {
      return true;
    } else {
      return false;
    }
  }
}


module.exports.ServiceContext = ServiceContext;
