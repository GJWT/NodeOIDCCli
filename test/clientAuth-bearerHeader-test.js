const assert = require('chai').assert;
const AccessTokenRequest =
    require('../oicMsg/oauth2/init.js').AccessTokenRequest;
const AccessTokenResponse =
    require('../oicMsg/oauth2/init.js').AccessTokenResponse;
const AuthorizationRequest =
    require('../oicMsg/oauth2/init.js').AuthorizationRequest;
const AuthorizationResponse =
    require('../oicMsg/oauth2/init.js').AuthorizationResponse;
const BearerHeader = require('../src/clientAuth/bearerHeader').BearerHeader;
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
  sdb.dict['ABCDE'] = {code: 'accessCode'};
  client.clientInfo.clientSecret = 'boardingPass';
  return client;
}

describe('Test bearer header', () => {
  let client;
  beforeEach(() => {
    client = getClient();
  });

  it('test construct', () => {
    const request = new ResourceRequest({access_token: 'Sesame'});
    const bh = new BearerHeader();
    const httpArgs = bh.construct(request);
    const testDict = {headers: {Authorization: 'Bearer Sesame'}};
    assert.deepEqual(testDict, httpArgs);
  });

  it('test construct with http args', () => {
    const request = new ResourceRequest({access_token: 'Sesame'});
    const bh = new BearerHeader();
    const httpArgs = bh.construct(request, null, {foo: 'bar'});
    assert.deepEqual(Object.keys(httpArgs), ['foo', 'headers']);
    const testDict = {Authorization: 'Bearer Sesame'};
    assert.deepEqual(testDict, httpArgs.headers);
  });

  it('test construct with headers in http args', () => {
    const request = new ResourceRequest({access_token: 'Sesame'});
    const bh = new BearerHeader();
    const httpArgs = bh.construct(request, null, {headers: {xfoo: 'bar'}});
    assert.deepEqual(Object.keys(httpArgs), ['headers']);
    assert.deepEqual(Object.keys(httpArgs.headers), ['xfoo', 'Authorization']);
    assert.deepEqual(httpArgs.headers['Authorization'], 'Bearer Sesame');
  });

  it('test construct with resource request', () => {
    const bh = new BearerHeader();
    const cis = new ResourceRequest({access_token: 'Sesame'});
    const httpArgs = bh.construct(cis, client.clientInfo);
    assert.isUndefined(cis.access_token);
    assert.deepEqual(httpArgs, {headers: {Authorization: 'Bearer Sesame'}});
  });

  it('test construct with token', () => {
    client.clientInfo.stateDb['AAAA'] = {};
    const resp1 = new AuthorizationResponse('auth_grant', 'AAAA');
    new client.service.Authorization().parseResponse(
        resp1, client.clientInfo, 'urlencoded');
    // based on state find the code and then get an access token
    const resp2 = new AccessTokenResponse({
      access_token: 'token1',
      token_type: 'Bearer',
      expires_in: 0,
      state: 'AAAA',
    });
    new client.service.AccessToken().parseResponse(
        resp2, client.clientInfo, 'urlencoded');
    const httpArgs = new BearerHeader().construct(
        new ResourceRequest(), client.clientInfo, null, null, {state: 'AAAA'});
    assert.deepEqual(httpArgs, {headers: {Authorization: 'Bearer token1'}});
  });
});