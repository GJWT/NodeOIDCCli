const assert = require('chai').assert;
const ClientInfo = require('../src/clientInfo.js');
const addCodeChallenge = require('../src/oic/pkce.js').addCodeChallenge;
const getCodeVerifier = require('../src/oic/pkce.js').getCodeVerifier;
const base64url = require('base64url');

describe('Test PKCE', function() {
  let ci;
  let spec;
  beforeEach(function() {
    let config = {
      'client_id': 'client_id',
      'issuer': 'issuer',
      'client_secret': 'client_secret',
      'base_url': 'https://example.com',
      'requests_dir': 'requests',
    };

    ci = new ClientInfo();
    ci.init(null, config);
    ci.stateDb['state'] = {};
    spec = addCodeChallenge(ci, 'state');
  });

  it('Test add code challenge default values', function() {
    assert.deepEqual(
        Object.keys(spec), ['code_challenge', 'code_challenge_method']);
    assert.deepEqual(spec['code_challenge_method'], 'sha256');

    let codeVerifier = getCodeVerifier(ci, 'state');
    assert.deepEqual(codeVerifier.length, 64);
  });
});

describe('Test PKCE', function() {
  let ci;
  let spec;
  beforeEach(function() {
    let config = {
      'client_id': 'client_id',
      'issuer': 'issuer',
      'client_secret': 'client_secret',
      'base_url': 'https://example.com',
      'requests_dir': 'requests',
      'code_challenge': {'length': 128, 'method': 'sha384'}
    };

    ci = new ClientInfo();
    ci.init(null, config);
    ci.stateDb['state'] = {};
    spec = addCodeChallenge(ci, 'state');
  });

  it('Test add code challenge default values', function() {
    assert.deepEqual(
        Object.keys(spec), ['code_challenge', 'code_challenge_method']);
    assert.deepEqual(spec['code_challenge_method'], 'sha384');

    let codeVerifier = getCodeVerifier(ci, 'state');
    assert.deepEqual(codeVerifier.length, 128);
  });
});