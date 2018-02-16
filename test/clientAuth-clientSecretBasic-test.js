const assert = require('chai').assert;
const AccessTokenRequest =
    require('../oicMsg/oauth2/init.js').AccessTokenRequest;
const AccessTokenResponse =
    require('../oicMsg/oauth2/init.js').AccessTokenResponse;
const AuthorizationRequest =
    require('../oicMsg/oauth2/init.js').AuthorizationRequest;
const AuthorizationResponse =
    require('../oicMsg/oauth2/init.js').AuthorizationResponse;
const CCAccessTokenRequest =
    require('../oicMsg/oauth2/init.js').CCAccessTokenRequest;
const Client = require('../src/oauth2/init').Client;
const CLIENT_AUTHN_METHOD =
    require('../src/clientAuth/clientAuth').CLIENT_AUTHN_METHOD;
const ClientSecretBasic =
    require('../src/clientAuth/clientSecretBasic').ClientSecretBasic;

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

describe('Test client secret basic', () => {
  let client;
  let httpArgs;
  beforeEach(() => {
    client = getClient();
    const accessToken = new client.service.AccessToken();
    accessToken.init();
    const cis = accessToken.construct(
        client.clientInfo, {},
        {redirect_uri: 'http://example.com', state: 'ABCDE'});
    const csb = new ClientSecretBasic();
    httpArgs = csb.construct(cis, client.clientInfo);
  });

  it('test construct', () => {
    const credentialsDict = {};
    credentialsDict['A'] = 'boarding pass';
    const authorizationDict = {};
    authorizationDict['Authorization'] = credentialsDict;
    const headersDict = {};
    headersDict.headers = authorizationDict;
    assert.deepEqual(headersDict, httpArgs);
  });

  it('test does not remove padding', () => {
    const cis = new AccessTokenRequest(
        {code: 'foo', redirect_uri: 'http://example.com'});
    const csb = new ClientSecretBasic();
    const httpArgs = csb.construct(
        cis, client.client_info, null, null, {user: 'ab', password: 'c'});
    const credentialsDict = {};
    credentialsDict['ab'] = 'c';
    const authorizationDict = {};
    authorizationDict['Authorization'] = credentialsDict;
    const headersDict = {};
    headersDict.headers = authorizationDict;
    assert.deepEqual(headersDict, httpArgs);
  });

  it('test construct cc', () => {
    const cis = new CCAccessTokenRequest({grant_type: 'client_credentials'});
    const csb = new ClientSecretBasic();
    const httpArgs = csb.construct(
        cis, client.client_info, null, null,
        {user: 'service1', password: 'secret'});
    const credentialsDict = {};
    credentialsDict['service1'] = 'secret';
    const authorizationDict = {};
    authorizationDict['Authorization'] = credentialsDict;
    const headersDict = {};
    headersDict.headers = authorizationDict;
    assert.deepEqual(headersDict, httpArgs);
  });
});