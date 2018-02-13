const AccessTokenResponse =
    require('../oicMsg/oauth2/init').AccessTokenResponse;
const assert = require('chai').assert;
const AuthorizationRequest =
    require('../oicMsg/oauth2/init').AuthorizationRequest;
const AuthorizationResponse =
    require('../oicMsg/oauth2/init').AuthorizationResponse;
const ExpiredToken = require('../src/state.js').ExpiredToken;
const State = require('../src/state.js').State;
const urlParse = require('url-parse');
const REQ_ARGS = {
  'redirect_uri': 'https://example.com/rp/cb',
  'response_type': 'code'
};

describe('create ClientInfo instance', function() {
  let stateDb;
  let state;
  beforeEach(function() {
    stateDb = new State();
    stateDb.init('client_id', 'state');
    let request = new AuthorizationRequest(REQ_ARGS);
    state = stateDb.createState('https://example.org/op', request);
  });

  it('Create State', function() {
    assert.isNotNull(state);
    for (let i = 0; i < Object.keys(REQ_ARGS).length; i++) {
      let key = Object.keys(REQ_ARGS)[i];
      let val = REQ_ARGS[key];
      assert.deepEqual(stateDb.state[key], val);
    };
  });

  it('Add message code', function() {
    let request = new AuthorizationRequest(REQ_ARGS);
    let state = stateDb.createState('https://example.org/op', request);
    let aresp = new AuthorizationResponse('access grant', state);
    stateDb.addResponse(aresp);
    assert.deepEqual(stateDb.state['code'], 'access grant');
  });

  it('Read state', function() {
    let request = new AuthorizationRequest(REQ_ARGS);
    let state = stateDb.createState('https://example.org/op', request);
    let info = stateDb.state;
    assert.deepEqual(info['client_id'], 'client_id');
    assert.deepEqual(info['as'], 'https://example.org/op');
    assert.deepEqual(info['redirect_uri'], 'https://example.com/rp/cb');
    assert.deepEqual(info['response_type'], 'code');
    assert.isTrue(Object.keys(info).indexOf('iat') !== -1)
  });

  it('Add message code token', function() {
    let request = new AuthorizationRequest(REQ_ARGS);
    let state = stateDb.createState('https://example.org/op', request);
    let aresp = new AuthorizationResponse(
        'access grant', state, 'access token', 'Bearer');
    stateDb.addResponse(aresp);
    assert.deepEqual(stateDb.state['code'], 'access grant');
    assert.deepEqual(
        stateDb.state['token'],
        {'access_token': 'access token', 'token_type': 'Bearer'});
  });

  it('Add message code id token', function() {
    let request = new AuthorizationRequest(REQ_ARGS);
    let state = stateDb.createState('https://example.org/op', request);
    let aresp = new AuthorizationResponse(
        'access grant', state, 'access token', 'Bearer', 'Dummy.JWT.foo');
    stateDb.addResponse(aresp);
    assert.deepEqual(stateDb.state['code'], 'access grant');
    assert.deepEqual(
        stateDb.state['token'],
        {'access_token': 'access token', 'token_type': 'Bearer'});
    assert.deepEqual(stateDb.state['id_token'], 'Dummy.JWT.foo');
  });

  it('Access token add message id token', function() {
    let request = new AuthorizationRequest(REQ_ARGS);
    let state = stateDb.createState('https://example.org/op', request);
    let aresp = new AuthorizationResponse('access grant', state);
    stateDb.addResponse(aresp);

    aresp = new AccessTokenResponse({
      access_token: 'access token',
      token_type: 'Bearer',
      id_token: 'Dummy.JWT.foo',
      expires_in: 600
    });
    let now = Date.now();
    stateDb.addResponse(aresp, state);
    assert.deepEqual(
        Object.keys(stateDb.state['token']).length,
        ['access_token', 'token_type', 'exp', 'expires_in'].length);
    assert.deepEqual(stateDb.state['id_token'], 'Dummy.JWT.foo');
    assert.isTrue(now <= stateDb.state['token']['exp']);
  });

  it('Access token add message id token', function() {
    let request = new AuthorizationRequest(REQ_ARGS);
    let state = stateDb.createState('https://example.org/op', request);
    let aresp = new AuthorizationResponse('access grant', state);
    stateDb.addResponse(aresp);
    aresp = new AccessTokenResponse({
      access_token: 'access token',
      token_type: 'Bearer',
      id_token: 'Dummy.JWT.foo',
      expires_in: 600
    });
    let now = Date.now();
    stateDb.addResponse(aresp, state);
    let ti = stateDb.getTokenInfo(state);
  });

  it('Access token add message id token', function() {
    let request = new AuthorizationRequest(REQ_ARGS);
    let state = stateDb.createState('https://example.org/op', request);
    let aresp = new AuthorizationResponse('access grant', state);
    stateDb.addResponse(aresp);
    aresp = new AccessTokenResponse({
      access_token: 'access token',
      token_type: 'Bearer',
      id_token: 'Dummy.JWT.foo',
      expires_in: 600
    });
    let now = Date.now();
    stateDb.addResponse(aresp, state);
    let ti = stateDb.getTokenInfo(state);
    assert.deepEqual(ti.access_token, 'access token');
    assert.deepEqual(ti.expires_in, 600);
    assert.deepEqual(ti.token_type, 'Bearer');
  });

  it('Get expired token', function() {
    let request = new AuthorizationRequest(REQ_ARGS);
    let state = stateDb.createState('https://example.org/op', request);
    let aresp = new AuthorizationResponse('access grant', state);
    stateDb.addResponse(aresp);
    aresp = new AccessTokenResponse({
      access_token: 'access token',
      token_type: 'Bearer',
      id_token: 'Dummy.JWT.foo',
      expires_in: 600
    });
    let now = Date.now() + 900;
    stateDb.addResponse(aresp, state);
    try {
      stateDb.getTokenInfo(state, now);
    } catch (err) {
      assert.isNotNull(err);
    }
  });

  it('Update token', function() {
    let request = new AuthorizationRequest(REQ_ARGS);
    let state = stateDb.createState('https://example.org/op', request);
    let aresp = new AuthorizationResponse('access grant', state);
    stateDb.addResponse(aresp);
    let aresp1 = new AccessTokenResponse({
      access_token: 'access token',
      token_type: 'Bearer',
      id_token: 'Dummy.JWT.foo',
      expires_in: 600
    });
    stateDb.addResponse(aresp1, state);
    aresp1 = new AccessTokenResponse({
      access_token: '2nd access token',
      token_type: 'Bearer',
      expires_in: 120
    });
    stateDb.addResponse(aresp1, state);
    let ti = stateDb.getTokenInfo(state);
    assert.deepEqual(ti.access_token, '2nd access token');
    let now = Date.now() + 200;
    try {
      stateDb.getTokenInfo(state, now);
    } catch (err) {
      assert.isNotNull(err);
    }
  });
});