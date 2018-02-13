const assert = require('chai').assert;
const AccessTokenRequest =
    require('../oicMsg/oauth2/init.js').AccessTokenRequest;
const AccessTokenResponse =
    require('../oicMsg/oauth2/init.js').AccessTokenResponse;
const AuthorizationRequest =
    require('../oicMsg/oauth2/init.js').AuthorizationRequest;
const AuthorizationResponse =
    require('../oicMsg/oauth2/init.js').AuthorizationResponse;
const BearerBody = require('../src/clientAuth/bearerBody').BearerBody;
const Client = require('../src/oauth2/init').Client;
const CLIENT_AUTHN_METHOD =
    require('../src/clientAuth/clientAuth').CLIENT_AUTHN_METHOD;
const ResourceRequest = require('../oicMsg/oauth2/init.js').ResourceRequest;

const CLIENT_ID = 'A';

const CLIENT_CONF = {
  issuer: 'https://example.com/as',
  redirect_uris: ['https://example.com/cli/authz_cb'],
  client_secret: 'boarding pass',
  client_id: CLIENT_ID,
};

const REQ_ARGS = {
  redirect_uri: 'https://example.com/rp/cb',
  response_type: 'code',
};

function getClient() {
  const client = new Client();
  client.init(CLIENT_AUTHN_METHOD, CLIENT_CONF);
  const sdb = client.clientInfo.stateDb;
  sdb.dict = {};
  sdb.dict['ABCDE'] = {'code': 'accessCode'};
  client.clientInfo.clientSecret = 'boardingPass';
  return client;
}

describe('Test bearer body', () => {
  let client;
  beforeEach(function() {
    client = getClient();
  });
  
  it('test construct with request args', () => {
    const requestArgs = {'access_token': 'Sesame'};
    let cis = new ResourceRequest();
    const list = new BearerBody().construct(cis, client.clientInfo, requestArgs);
    const httpArgs = list[0];
    cis = list[1];

    assert.deepEqual(cis['access_token'], 'Sesame');
    assert.deepEqual(httpArgs, undefined);
  });

  it('test construct with state', () => {
    const sdb = client.clientInfo.stateDb;
    sdb['FFFFF'] = {};
    const resp = new AuthorizationResponse('code', 'FFFFF')
    sdb.addResponse(resp);
    const atr = new AccessTokenResponse({
      'access_token': '2YotnFZFEjr1zCsicMWpAA',
      'token_type': 'example',
      'refresh_token': 'tGzv3JOkF0XG5Qx2TlKWIA',
      'example_parameter': 'example_value',
      'scope': ['inner', 'outer']
    });
    sdb.addResponse(atr, {'state': 'FFFFF'});
    let cis = new ResourceRequest();
    const list = new BearerBody().construct(
        cis, client.clientInfo, {}, null, {'state': 'FFFFF'}, 'inner');
    const httpArgs = list[0];
    cis = list[1];
    assert.deepEqual(cis['access_token'], '2YotnFZFEjr1zCsicMWpAA');
    assert.deepEqual(httpArgs, null);
  });

  it('test construct with request', () => {
    const sdb = client.clientInfo.stateDb;
    sdb['EEEE'] = {};
    const resp = new AuthorizationResponse('auth_grant', 'EEEE');
    new client.service['Authorization']().parseResponse(
        resp, client.clientInfo, 'urlencoded');

    const resp2 = new AccessTokenResponse({
      'access_token': 'token1',
      'token_type': 'Bearer',
      'expires_in': 0,
      'state': 'EEEE'
    });
    new client.service['AccessToken']().parseResponse(
        resp2, client.clientInfo, 'urlencoded');
    let cis = new ResourceRequest();
    const list = new BearerBody().construct(
        cis, client.clientInfo, null, null, {'state': 'EEEE'});
    const httpArgs = list[0];
    cis = list[1];
    assert.isTrue(Object.keys(cis).indexOf('access_token') !== -1);
    assert.deepEqual(cis['access_token'], 'token1');
  });
});