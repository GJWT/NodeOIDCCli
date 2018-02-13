const AuthorizationResponse =
    require('../oicMsg/oauth2/init.js').AuthorizationResponse;
const Token = require('../oicMsg/src/models/tokenProfiles/token');

class StateJWT extends Token {
  constructor() {
    super();
    this.cParam = super.cParam;
    this.cParam = Object.assign(this.cParam, {
      'rfp': SINGLE_REQUIRED_STRING,
      'kid': SINGLE_OPTIONAL_STRING,
      'target_link_uri': SINGLE_OPTIONAL_STRING,
      'as': SINGLE_OPTIONAL_STRING,
      'at_hash': SINGLE_OPTIONAL_STRING,
      'c_hash': SINGLE_OPTIONAL_STRING
    });
  }
}

/**
 * Given state I need to be able to find valid access token and id_token
 * and to whom it was sent.
 */
class State {
  init(client_id, db, dbName, lifeTime) {
    db = db || null;
    dbName = dbName = '';
    lifeTime = lifeTime || 600;

    this.client_id = client_id;
    this.db = db;
    if (this.db == null) {
      if (dbName) {
        this.db = shelve.open(dbName, true);
      } else {
        this.db = {};
      }
    }
    this.lifeTime = lifeTime;
  }

  createState(receiver, request) {
    let state = Math.random().toString(26).substring(2, 15);
    let now = Date.now();
    let stateInfo = {'client_id': this.client_id, 'as': receiver, 'iat': now};
    stateInfo = Object.assign(stateInfo, request);
    this.state = stateInfo;
    return state;
  }

  updateTokenInfo(stateInfo, msg) {
    let tInfo = null;
    if (stateInfo['token']) {
      tInfo = stateInfo['token'];
    } else {
      tInfo = {};
    }

    let token = null;
    try {
      token = msg['access_token'];
    } catch (err) {
      console.log(err);
    }
    var exp = 0;
    if (token) {
      tInfo['access_token'] = token;
      if (msg['expires_in']) {
        exp = msg['expires_in'];
      } else {
        if (tInfo['expires_in']) {
          tInfo['exp'] = Date.now() + tInfo['expires_in'];
        }
      }

      if (exp) {
        tInfo['expires_in'] = exp;
        tInfo['exp'] = Date.now() + exp;
      }

      let claims = ['token_type', 'scope'];
      for (let i = 0; i < claims.length; i++) {
        let claim = claims[i];
        try {
          if (msg[claim]) {
            tInfo[claim] = msg[claim];
          }
        } catch (err) {
          console.log(err);
        }
      }

      stateInfo['token'] = tInfo;
    }
    return stateInfo;
  }

  addResponse(response, state) {
    state = state || '';

    if (!state) {
      state = response['state'];
    }
    let stateInfo = this.state;
    if (!stateInfo) {
      stateInfo = this[state];
    }

    if (response['code']) {
      stateInfo['code'] = response['code'];
    }

    this.updateTokenInfo(stateInfo, response);
    let claims = ['id_token', 'refresh_token'];
    for (let i = 0; i < claims.length; i++) {
      let claim = claims[i];
      if (response[claim]) {
        stateInfo[claim] = response[claim];
      }
    }
    this.state = stateInfo;
    return stateInfo;
  }


  addInfo(state, kwargs) {
    let stateInfo = this[state];
    stateInfo = Object.assign(stateInfo, kwargs);
    this[state] = stateInfo;
    return stateInfo;
  }

  bindNonceToState(nonce, state) {
    this.db['nonce_' + nonce] = state;
  }

  nonceToState(nonce) {
    return this.db['nonce_' + nonce];
  }

  getTokenInfo(state, now, kwargs) {
    let tInfo = this[state]['token'];
    var exp = null;
    try {
      exp = tInfo['exp'];
    } catch (err) {
      console.log(err);
    }
    var now = null;
    if (!now) {
      now = Date.now();
    }

    if (now > exp) {
      console.log('Passed best before');
    }
    return tInfo;
  }

  getTokenInfo(state, request, now, kwargs) {
    let tInfo = {};
    if (this.state && this.state['token']) {
      tInfo = this.state['token'];
    }
    try {
      var exp = tInfo['exp'];
    } catch (err) {
      console.log(err);
    }
    if (!now) {
      now = Date.now();
    }
    if (now > exp) {
      throw new Error('Passed best before');
    }
    return tInfo;
  }

  getResponseArgs(state, request, now, kwargs) {
    let sInfo = {};
    if (this.dict) {
      sInfo = this.dict[state];
    } else {
      sInfo = this[state];
    }
    let tInfo = {};
    let reqArgs = {};
    now = now || 0;
    if (request) {
      for (let i = 0; i < Object.keys(request.prototype.cParam).length; i++) {
        let claim = Object.keys(request.prototype.cParam)[i];
        if (claim === 'access_token') {
          try {
            tInfo = this.getTokenInfo(state, now);
          } catch (err) {
            continue;
          }
          reqArgs[claim] = tInfo['access_token'];
        } else {
          if (sInfo[claim]) {
            reqArgs[claim] = sInfo[claim];
          }
        }
      }
    }
    return reqArgs;
  }

  getIdToken(state) {
    return this[state]['idToken'];
  }
}

module.exports.StateJWT = StateJWT;
module.exports.State = State;