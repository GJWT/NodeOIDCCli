var AuthorizationResponse = require('../oicMsg/oauth2/init.js').AuthorizationResponse;
var Token = require('../oicMsg/src/models/tokenProfiles/token');

StateJWT.prototype = new Token();
StateJWT.prototype = Object.create(Token.prototype);
StateJWT.prototype.constructor = StateJWT;

function StateJWT() {
  cparam = JsonWebToken.cparam;
  cparam.update({
    'rfp': SINGLE_REQUIRED_STRING,
    'kid': SINGLE_OPTIONAL_STRING,
    'target_link_uri': SINGLE_OPTIONAL_STRING,
    'as': SINGLE_OPTIONAL_STRING,
    'at_hash': SINGLE_OPTIONAL_STRING,
    'c_hash': SINGLE_OPTIONAL_STRING
  })
};

/**
 * Given state I need to be able to find valid access token and id_token
 * and to whom it was sent.
 */
function State() {
  // KeyError.call();
};

/**
 * More complicated logic then I would have liked it to be
 *
 */
State.prototype.init = function(client_id, db, dbName, lifeTime) {
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
};

State.prototype.createState = function(receiver, request) {
  var state = Math.random().toString(26).substring(2, 15);
  var now = Date.now();
  var stateInfo = {'client_id': this.client_id, 'as': receiver, 'iat': now};
  stateInfo = Object.assign(stateInfo, request);
  this.state = stateInfo;
  return state;
};

State.prototype.updateTokenInfo = function(stateInfo, msg) {
  var tInfo = null;
  if (stateInfo['token']) {
    tInfo = stateInfo['token'];
  } else {
    tInfo = {};
  }

  var token = null;
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

    var claims = ['token_type', 'scope'];
    for (var i = 0; i < claims.length; i++) {
      var claim = claims[i];
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
};

State.prototype.addResponse = function(response, state) {
  state = state || '';

  if (!state) {
    state = response['state'];
  }
  var stateInfo = this.state;
  if (!stateInfo) {
    stateInfo = this[state];
  }

  if (response['code']) {
    stateInfo['code'] = response['code'];
  }

  this.updateTokenInfo(stateInfo, response);
  var claims = ['id_token', 'refresh_token'];
  for (var i = 0; i < claims.length; i++) {
    var claim = claims[i];
    if (response[claim]) {
      stateInfo[claim] = response[claim];
    }
  }
  this.state = stateInfo;
  return stateInfo;
};

State.prototype.addInfo = function(state, kwargs) {
  var info = [state];
  info.update(kwargs);
  this.db['state_' + state] = info;
  return info;
};

State.prototype.bindNonceToState = function(nonce, state) {
  this.db['nonce_' + state];
};

State.prototype.nonceToState = function(nonce) {
  return this.db['nonce_' + nonce];
};

State.prototype.getTokenInfo = function(state, now, kwargs) {
  var tInfo = this[state]['token'];
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
};

State.prototype.getTokenInfo = function(state, request, now, kwargs) {
  var tInfo = {};
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
};

State.prototype.getResponseArgs = function(state, request, now, kwargs) {
  var sInfo = {};
  if (this.dict) {
    sInfo = this.dict[state];
  } else {
    sInfo = this[state];
  }
  var tInfo = {};
  var reqArgs = {};
  now = now || 0;
  if (request) {
    for (var i = 0; i < Object.keys(request.cParam).length; i++) {
      var claim = Object.keys(request.cParam)[i];
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
};

State.prototype.getIdToken = function(state) {
  return this[state]['idToken'];
};

module.exports.StateJWT = StateJWT;
module.exports.State = State;