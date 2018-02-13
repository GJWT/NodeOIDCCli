const assert = require('chai').assert;
const ClientInfo = require('../src/clientInfo.js');
const urlParse = require('url-parse');

describe('', function() {
  let config = {
    'client_id': 'client_id',
    'issuer': 'issuer',
    'client_secret': 'client_secret',
    'base_url': 'https://example.com',
    'requests_dir': 'requests'
  };

  let ci = new ClientInfo();
  ci.init(null, config);

  it('create ClientInfo instance', function() {
    assert.isNotNull(ci);
  });

  ci.registrationResponse = {
    'application_type': 'web',
    'redirect_uris': [
      'https://client.example.org/callback',
      'https://client.example.org/callback2'
    ],
    'token_endpoint_auth_method': 'client_secret_basic',
    'jwks_uri': 'https://client.example.org/my_public_keys.jwks',
    'userinfo_encrypted_response_alg': 'RSA1_5',
    'userinfo_encrypted_response_enc': 'A128CBC-HS256',
  };

  let res = ci.signEncAlgs('userinfo');
  it('registration userInfo signEncAlgs', function() {
    assert.deepEqual(
        res, {'sign': 'RS256', 'alg': 'RSA1_5', 'enc': 'A128CBC-HS256'});
  });

  ci.registrationResponse = {
    'application_type': 'web',
    'redirect_uris': [
      'https://client.example.org/callback',
      'https://client.example.org/callback2'
    ],
    'token_endpoint_auth_method': 'client_secret_basic',
    'jwks_uri': 'https://client.example.org/my_public_keys.jwks',
    'userinfo_encrypted_response_alg': 'RSA1_5',
    'userinfo_encrypted_response_enc': 'A128CBC-HS256',
    'request_object_signing_alg': 'RS384'
  };

  res = ci.signEncAlgs('userinfo');
  it('registration request object signEncAlgs typ userinfo', function() {
    assert.deepEqual(
        res, {'sign': 'RS256', 'alg': 'RSA1_5', 'enc': 'A128CBC-HS256'});
  });

  let res2 = ci.signEncAlgs('request');
  it('registration request object signEncAlgs typ request', function() {
    assert.deepEqual(res2, {'sign': 'RS384'});
  });

  ci.registrationResponse = {
    'application_type': 'web',
    'redirect_uris': [
      'https://client.example.org/callback',
      'https://client.example.org/callback2'
    ],
    'token_endpoint_auth_method': 'client_secret_basic',
    'jwks_uri': 'https://client.example.org/my_public_keys.jwks',
    'userinfo_encrypted_response_alg': 'RSA1_5',
    'userinfo_encrypted_response_enc': 'A128CBC-HS256',
    'request_object_signing_alg': 'RS384',
    'id_token_encrypted_response_alg': 'ECDH-ES',
    'id_token_encrypted_response_enc': 'A128GCM',
    'id_token_signed_response_alg': 'ES384',
  };

  let res3 = ci.signEncAlgs('userinfo');
  it('registration request object signEncAlgs typ userinfo', function() {
    assert.deepEqual(
        res3, {'sign': 'RS256', 'alg': 'RSA1_5', 'enc': 'A128CBC-HS256'});
  });

  let res4 = ci.signEncAlgs('request');
  it('registration request object signEncAlgs typ request', function() {
    assert.deepEqual(res4, {'sign': 'RS384'});
  });

  let res5 = ci.signEncAlgs('id_token');
  it('registration request object signEncAlgs typ id_token', function() {
    assert.deepEqual(
        res5, {'sign': 'ES384', 'alg': 'ECDH-ES', 'enc': 'A128GCM'});
  });

  ci.providerInfo = {
    'version': '3.0',
    'issuer': 'https://server.example.com',
    'authorization_endpoint': 'https://server.example.com/connect/authorize',
    'token_endpoint': 'https://server.example.com/connect/token',
    'token_endpoint_auth_methods_supported':
        ['client_secret_basic', 'private_key_jwt'],
    'token_endpoint_auth_signing_alg_values_supported': ['RS256', 'ES256'],
    'userinfo_endpoint': 'https://server.example.com/connect/userinfo',
    'check_session_iframe': 'https://server.example.com/connect/check_session',
    'end_session_endpoint': 'https://server.example.com/connect/end_session',
    'jwks_uri': 'https://server.example.com/jwks.json',
    'registration_endpoint': 'https://server.example.com/connect/register',
    'scopes_supported':
        ['openid', 'profile', 'email', 'address', 'phone', 'offline_access'],
    'response_types_supported':
        ['code', 'code id_token', 'id_token', 'token id_token'],
    'acr_values_supported':
        ['urn:mace:incommon:iap:silver', 'urn:mace:incommon:iap:bronze'],
    'subject_types_supported': ['public', 'pairwise'],
    'userinfo_signing_alg_values_supported': ['RS256', 'ES256', 'HS256'],
    'userinfo_encryption_alg_values_supported': ['RSA1_5', 'A128KW'],
    'userinfo_encryption_enc_values_supported': ['A128CBC+HS256', 'A128GCM'],
    'id_token_signing_alg_values_supported': ['RS256', 'ES256', 'HS256'],
    'id_token_encryption_alg_values_supported': ['RSA1_5', 'A128KW'],
    'id_token_encryption_enc_values_supported': ['A128CBC+HS256', 'A128GCM'],
    'request_object_signing_alg_values_supported': ['none', 'RS256', 'ES256'],
    'display_values_supported': ['page', 'popup'],
    'claim_types_supported': ['normal', 'distributed'],
    'claims_supported': [
      'sub', 'iss', 'auth_time', 'acr', 'name', 'given_name', 'family_name',
      'nickname', 'profile', 'picture', 'website', 'email', 'email_verified',
      'locale', 'zoneinfo', 'http://example.info/claims/groups'
    ],
    'claims_parameter_supported': true,
    'service_documentation':
        'http://server.example.com/connect/service_documentation.html',
    'ui_locales_supported': ['en-US', 'en-GB', 'en-CA', 'fr-FR', 'fr-CA']
  }

  let res6 = ci.verifyAlgSupport('RS256', 'id_token', 'signing_alg');
  it('verify_alg_support', function() {
    assert.isTrue(res6);
  });

  let res7 = ci.verifyAlgSupport('RS512', 'id_token', 'signing_alg')
  it('verify_alg_support', function() {
    assert.isFalse(res7);
  });

  let res8 = ci.verifyAlgSupport('RSA1_5', 'userinfo', 'encryption_alg');
  it('verify_alg_support', function() {
    assert.isTrue(res8);
  });

  let res9 = ci.verifyAlgSupport('ES256', 'token_endpoint_auth', 'signing_alg');
  it('verify_alg_support', function() {
    assert.isTrue(res9);
  });

  ci.providerInfo['issuer'] = 'https://example.com/';
  let url_list = ci.generateRequestUris('/leading');
  let sp = urlParse(url_list[0]);
  let p = sp.pathname.split('/');

  it('verify_requests_uri', function() {
    assert.deepEqual(p[0], '');
    assert.deepEqual(p[1], 'leading');
    assert.deepEqual(p.length, 3);
  });

  ci.providerInfo['issuer'] = 'https://op.example.org/';
  url_list = ci.generateRequestUris('/leading');
  sp = urlParse(url_list[0]);
  let np = sp.pathname.split('/');

  it('verify_requests_uri test2', function() {
    assert.deepEqual(np[0], '');
    assert.deepEqual(np[1], 'leading');
    assert.deepEqual(np.length, 3);
    assert.notDeepEqual(np[2], p[2]);
  });
});

describe('client info tests', function() {
  let config;
  let ci;
  beforeEach(function() {
    config = {
      'client_id': 'client_id',
      'issuer': 'issuer',
      'client_secret': 'client_secret',
      'base_url': 'https://example.com',
      'requests_dir': 'requests'
    };

    ci = new ClientInfo();
    ci.init(null, config);
  });

  it('client info init', function() {
    for (let i = 0; i < Object.keys(config); i++) {
      let attr = Object.keys(config)[i];
      if (attr === 'client_id') {
        assert.deepEqual(ci.clientId, config[attr]);
      } else if (attr === 'issuer') {
        assert.deepEqual(ci.issuer, config[attr]);
      } else if (attr === 'client_secret') {
        assert.deepEqual(ci.clientSecret, config[attr]);
      } else if (attr === 'base_url') {
        assert.deepEqual(ci.base_url, config[attr]);
      } else if (attr === 'requests_dir') {
        assert.deepEqual(ci.base_url, config[attr]);
      }
    }
    assert.isNotNull(ci);
  });
});

describe('set and get client secret', function() {
  let ci;
  beforeEach(function() {
    ci = new ClientInfo();
    ci.init();
    ci.clientSecret = 'supersecret';
  });

  it('client info init', function() {
    assert.deepEqual(ci.clientSecret, 'supersecret');
  });
});

describe('set and get client id', function() {
  let ci;
  beforeEach(function() {
    ci = new ClientInfo();
    ci.init();
    ci.clientId = 'myself';
    ci.stateDb.clientId = 'myself';
  });

  it('client info init clientId', function() {
    assert.deepEqual(ci.clientId, 'myself');
  });

  it('client info init stateDb clientId', function() {
    assert.deepEqual(ci.stateDb.clientId, 'myself');
  });
});

describe('client filename', function() {
  let config;
  let ci;
  let fname;
  beforeEach(function() {
    config = {
      'client_id': 'client_id',
      'issuer': 'issuer',
      'client_secret': 'client_secret',
      'base_url': 'https://example.com',
      'requests_dir': 'requests'
    };
    ci = new ClientInfo();
    ci.init(null, config);
    fname = ci.filenameFromWebName('https://example.com/rq12345');
  });
  it('client filename', function() {
    assert.deepEqual(fname, 'rq12345');
  });
});