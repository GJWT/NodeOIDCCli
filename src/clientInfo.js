const State = require('./state.js').State;
const crypto = require('crypto');
const KeyJar = require('../oicMsg/src/models/keystore-dependency/KeyJar');
const assert = require('chai').assert;

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

class ClientInfo {
  constructor() {
    this.clientSecret = [this.getClientSecret, this.setClientSecret];
  }

  init(keyjar, config, events, db, dbName, strictOnPreferences, kwargs) {
    keyjar = keyjar || null;
    this.keyjar = keyjar || new KeyJar();
    this.stateDb = new State();
    this.stateDb.init('', db, dbName);
    this.config = config || null;
    this.events = events || null;
    this.db = db || null;
    this.dbName = dbName || '';
    this.strictOnPreferences = strictOnPreferences || false;
    this.providerInfo = {};
    this.registrationResponse = {};
    this.kid = {'sig': {}, 'enc': {}};
    this.config = config || {};
    this.baseUrl = '';
    this.requestDir = '';
    this.allow = {};
    this.behavior = {};
    this.clientPrefs = {};
    this.cId = '';
    this.cSecret = '';
    this.issuer = '';
    let items = [];

    if (kwargs) {
      items = kwargs.items();
    }
    for (let i = 0; i < items.length; i++) {
      let pair = kwargs.items()[i];
      let key = pair[0];
      let val = pair[1];
      this.key = val;
    }

    let clientInfo =
        ['client_id', 'issuer', 'client_secret', 'base_url', 'requests_dir'];
    let defaultVal = '';
    for (let i = 0; i < clientInfo.length; i++) {
      let attr = clientInfo[i];
      if (attr === 'client_id') {
        this.client_id = this.config[attr] || defaultVal;
        this.stateDb.clientId = this.config[attr];
      } else if (attr === 'issuer') {
        this.issuer = this.config[attr] || defaultVal;
      } else if (attr === 'client_secret') {
        this.client_secret = this.config[attr] || defaultVal;
      } else if (attr === 'base_url') {
        this.base_url = this.config[attr] || defaultVal;
      } else if (attr === 'requests_dir') {
        this.request_dir = this.config[attr] || defaultVal;
      }
    };

    let providerInfo = ['allow', 'client_prefs', 'behaviour', 'provider_info'];
    defaultVal = {};
    for (let i = 0; i < providerInfo.length; i++) {
      let attr = providerInfo[i];
      if (attr === 'allow') {
        this.allow = this.config[attr] || defaultVal;
      } else if (attr === 'client_prefs') {
        this.client_prefs = this.config[attr] || defaultVal;
      } else if (attr === 'behaviour') {
        this.behavior = this.config[attr] || defaultVal;
      } else if (attr === 'provider_info') {
        this.provider_info = this.config[attr] || defaultVal;
      }
    };

    try {
      this.redirectUris = this.config['redirect_uris'];
    } catch (err) {
      this.redirectUris = [null];
    }

    if (config && Object.keys(config).indexOf('keydefs') !== -1) {
      this.keyjar = this.buildKeyJar(config['keydefs'], this.keyjar)[1];
    }

    return this;
  }

  getClientSecret() {
    return this.client_secret;
  }

  setClientSecret(val) {
    if (!val) {
      this.client_secret;
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
   * @param {*} Typ One of the following types: 'id_token', 'userinfo' or 'request_object'
   */
  signEncAlgs(typ) {
    let resp = {};
    for (let i = 0; i < Object.keys(ATTRMAP[typ]).length; i++) {
      let key = Object.keys(ATTRMAP[typ])[i];
      let val = ATTRMAP[typ][key];
      if (key === 'sign') {
        try {
          resp[key] = DEFAULT_SIGN_ALG[typ];
        } catch (err) {
          return;
        }
      } else if (this.registrationResponse[val]) {
        resp[key] = this.registrationResponse[val];
      }
    }
    return resp;
  }

  /**
   * Verifies that the algorithm to be used are supported by the other side
   * @param {*} alg The algorithm specification
   * @param {*} usage In which context the 'alg' will be used.
   * @param typ Type of alg
   */
  verifyAlgSupport(alg, usage, typ) {
    let supported = this.providerInfo[usage + '_' + typ + '_values_supported'];
    if (supported.indexOf(alg) !== -1) {
      return true;
    } else {
      return false;
    }
  }

  /**
   *  Need to generate a path that is unique for the OP/RP combo
   * @param {*} requestDir Directory of the request
   */
  generateRequestUris(requestDir) {
    let m = crypto.createHmac('sha256', '');
    try {
      m.update(this.providerInfo['issuer']);
    } catch (error) {
      m.update(this.issuer);
    }
    m.update(this.baseUrl);
    return [this.baseUrl + requestDir + '/' + m.digest('hex')];
  }

  filenameFromWebName(webName) {
    assert.isTrue(webName.startsWith(this.baseUrl));
    let name = webName.substring(this.baseUrl.length, webName.length);
    if (name.startsWith('/')) {
      return name.substring(1, name.length);
    } else {
      let splitName = name.split('/');
      return splitName[splitName.length - 1];
    }
  }
}

module.exports = ClientInfo;