const AccessTokenRequest =
    require('../oicMsg/oauth2/init.js').AccessTokenRequest;
const AccessTokenResponse =
    require('../oicMsg/oauth2/init.js').AccessTokenResponse;
const assert = require('chai').assert;
const AuthorizationRequest =
    require('../oicMsg/oauth2/init.js').AuthorizationRequest;
const AuthorizationResponse =
    require('../oicMsg/oauth2/init.js').AuthorizationResponse;
const BearerBody = require('../src/clientAuth/bearerBody').BearerBody;
const BearerHeader = require('../src/clientAuth/bearerHeader').BearerHeader;
const CCAccessTokenRequest =
    require('../oicMsg/oauth2/init.js').CCAccessTokenRequest;
const Client = require('../src/oic/init').Client;
const CLIENT_AUTHN_METHOD =
    require('../src/clientAuth/privateKeyJWT').CLIENT_AUTHN_METHOD;
const ClientInfo = require('../src/clientInfo');
const ClientSecretBasic =
    require('../src/clientAuth/clientSecretBasic').ClientSecretBasic;
const ClientSecretPost =
    require('../src/clientAuth/clientSecretPost').ClientSecretPost;
const ResourceRequest = require('../oicMsg/oauth2/init.js').ResourceRequest;
const Service = require('../src/service').Service;
const validClientInfo = require('../src/clientAuth/clientAuth').validClientInfo;

const CLIENT_ID = 'A';

const CLIENT_CONF = {
  'issuer': 'https://example.com/as',
  'redirect_uris': ['https://example.com/cli/authz_cb'],
  'client_secret': 'boarding pass',
  'client_id': CLIENT_ID
};

const REQ_ARGS = {
  'redirect_uri': 'https://example.com/rp/cb',
  'response_type': 'code'
};

function getClient() {
  let redirect_uri = 'http://example.com/redirect';
  let conf = {
    'redirect_uris': ['https://example.com/cli/authz_cb'],
    'client_id': 'client_1',
    'client_secret': 'abcdefghijklmnop'
  };
  let client = new Client();
  client.init(CLIENT_AUTHN_METHOD);
  let ci = new ClientInfo();
  client.clientInfo = ci.init(null, conf);
  client.clientInfo.stateDb['ABCDE'] = {'code': 'access_code'};
  return client;
}

describe('Test client', function() {
  var client;
  beforeEach(function() {
    client = getClient();
  });

  it('test construct authorization request', function() {
    let requestArgs = {
      'state': 'ABCDE',
      'redirect_uri': 'https://example.com/auth_cb',
      'response_type': ['code']
    };
    let msg = new client.service['Authorization']().construct(
        client.clientInfo, requestArgs);
    assert.deepEqual(msg['client_id'], 'client_1');
    assert.deepEqual(msg['redirect_uri'], 'https://example.com/auth_cb');
  });

  it('test construct accesstoken request', function() {
    let reqArgs = {};
    let msg = new client.service['AccessToken']().construct(
        client.clientInfo, reqArgs, {'state': 'ABCDE'});
    assert.deepEqual(msg['code'], 'access_code');
    assert.deepEqual(msg['grant_type'], 'authorization_code');
    assert.deepEqual(msg['client_secret'], 'abcdefghijklmnop');
    assert.deepEqual(msg['client_id'], 'client_1');
  });

  it('test construct refreshtoken request', function() {
    let resp = new AccessTokenResponse(
        {'refresh_token': 'refresh_with_me', 'access_token': 'access'});
    client.clientInfo.stateDb.addResponse(resp, 'ABCDE');
    let reqArgs = {};
    let msg = new client.service['RefreshAccessToken']().construct(
        client.clientInfo, reqArgs, {'state': 'ABCDE'});
    assert.deepEqual(msg['refresh_token'], 'refresh_with_me');
    assert.deepEqual(msg['grant_type'], 'refresh_token');
    assert.deepEqual(msg['client_secret'], 'abcdefghijklmnop');
    assert.deepEqual(msg['client_id'], 'client_1');
  });

  it('test construct userinfo request init', function() {
    let resp = new AccessTokenResponse(
        {'refresh_token': 'refresh_with_me', 'access_token': 'access'});
    client.clientInfo.stateDb.addResponse(resp, 'ABCDE');

    let srv = new client.service['UserInfo']();
    srv.endpoint = 'https://example.com/userinfo';
    let info = srv.doRequestInit(
        client.clientInfo, null, null, null, null, null, {'state': 'ABCDE'});
    assert.isNotNull(info);
    assert.deepEqual(info['cis'], {});
    assert.deepEqual(
        info['httpArgs'], {'headers': {'Authorization': 'Bearer access'}});
  });
});