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
  let client = new Client();
  client.init(CLIENT_AUTHN_METHOD, CLIENT_CONF);
  let sdb = client.clientInfo.stateDb;
  sdb.dict = {};
  sdb.dict['ABCDE'] = {'code': 'accessCode'};
  client.clientInfo.clientSecret = 'boardingPass';
  return client;
}

describe('Test client secret basic', function() {
  var client;
  var httpArgs;
  beforeEach(function() {
    client = getClient();
    let accessToken = new client.service['AccessToken']();
    accessToken.init();
    let cis = accessToken.construct(
        client.clientInfo, {},
        {'redirect_uri': 'http://example.com', 'state': 'ABCDE'});
    let csb = new ClientSecretBasic();
    httpArgs = csb.construct(cis, client.clientInfo);
  });

  it('test construct', function() {
    let credentialsDict = {};
    credentialsDict['A'] = 'boarding pass';
    let authorizationDict = {};
    authorizationDict['Authorization'] = credentialsDict;
    let headersDict = {};
    headersDict['headers'] = authorizationDict;
    assert.deepEqual(headersDict, httpArgs);
  });

  it('test does not remove padding', function() {
    let cis = new AccessTokenRequest(
        {'code': 'foo', 'redirect_uri': 'http://example.com'});
    let csb = new ClientSecretBasic();
    let httpArgs = csb.construct(
        cis, client.client_info, null, null, {'user': 'ab', 'password': 'c'});
    let credentialsDict = {};
    credentialsDict['ab'] = 'c';
    let authorizationDict = {};
    authorizationDict['Authorization'] = credentialsDict;
    let headersDict = {};
    headersDict['headers'] = authorizationDict;
    assert.deepEqual(headersDict, httpArgs);
  });

  it('test construct cc', function() {
    let cis = new CCAccessTokenRequest({'grant_type': 'client_credentials'});
    let csb = new ClientSecretBasic();
    let httpArgs = csb.construct(
        cis, client.client_info, null, null,
        {'user': 'service1', 'password': 'secret'});
    let credentialsDict = {};
    credentialsDict['service1'] = 'secret';
    let authorizationDict = {};
    authorizationDict['Authorization'] = credentialsDict;
    let headersDict = {};
    headersDict['headers'] = authorizationDict;
    assert.deepEqual(headersDict, httpArgs);
  });
});