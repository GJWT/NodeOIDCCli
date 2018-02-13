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
const BearerHeader = require('../src/clientAuth/bearerHeader').BearerHeader;
const CCAccessTokenRequest =
    require('../oicMsg/oauth2/init.js').CCAccessTokenRequest;
const Client = require('../src/oauth2/init').Client;
const CLIENT_AUTHN_METHOD =
    require('../src/clientAuth/clientAuth').CLIENT_AUTHN_METHOD;
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

describe('Test bearer header', function() {
  var client;
  beforeEach(function() {
    client = getClient();
  });
  it('test construct', function() {
    let request = new ResourceRequest({'access_token': 'Sesame'});
    let bh = new BearerHeader();
    let httpArgs = bh.construct(request);
    let testDict = {'headers': {'Authorization': 'Bearer Sesame'}};
    assert.deepEqual(testDict, httpArgs);
  });

  it('test construct with http args', function() {
    let request = new ResourceRequest({'access_token': 'Sesame'});
    let bh = new BearerHeader();
    let httpArgs = bh.construct(request, null, {'foo': 'bar'});
    assert.deepEqual(Object.keys(httpArgs), ['foo', 'headers']);
    let testDict = {'Authorization': 'Bearer Sesame'};
    assert.deepEqual(testDict, httpArgs['headers']);
  });

  it('test construct with headers in http args', function() {
    let request = new ResourceRequest({'access_token': 'Sesame'});
    let bh = new BearerHeader();
    let httpArgs = bh.construct(request, null, {'headers': {'x-foo': 'bar'}});
    assert.deepEqual(Object.keys(httpArgs), ['headers']);
    assert.deepEqual(
        Object.keys(httpArgs['headers']), ['x-foo', 'Authorization']);
    assert.deepEqual(httpArgs['headers']['Authorization'], 'Bearer Sesame');
  });

  it('test construct with resource request', function() {
    let bh = new BearerHeader();
    let cis = new ResourceRequest({'access_token': 'Sesame'});
    let httpArgs = bh.construct(cis, client.clientInfo);
    assert.deepEqual(Object.keys(cis).indexOf('access_token'), -1);
    assert.deepEqual(httpArgs, {'headers': {'Authorization': 'Bearer Sesame'}});
  });

  it('test construct with token', function() {
    client.clientInfo.stateDb['AAAA'] = {};
    let resp1 = new AuthorizationResponse('auth_grant', 'AAAA');
    new client.service['Authorization']().parseResponse(
        resp1, client.clientInfo, 'urlencoded');
    // based on state find the code and then get an access token
    let resp2 = new AccessTokenResponse({
      'access_token': 'token1',
      'token_type': 'Bearer',
      'expires_in': 0,
      'state': 'AAAA'
    });
    new client.service['AccessToken']().parseResponse(
        resp2, client.clientInfo, 'urlencoded');
    let httpArgs = new BearerHeader().construct(
        new ResourceRequest(), client.clientInfo, null, null,
        {'state': 'AAAA'});
    assert.deepEqual(httpArgs, {'headers': {'Authorization': 'Bearer token1'}});

  });
});

describe('Test bearer header', function() {
  var client;
  beforeEach(function() {
    client = getClient();
  });
  it('test construct with request args', function() {
    let requestArgs = {'access_token': 'Sesame'};
    let cis = new ResourceRequest();
    let list = new BearerBody().construct(cis, client.clientInfo, requestArgs);
    let httpArgs = list[0];
    cis = list[1];

    assert.deepEqual(cis['access_token'], 'Sesame');
    assert.deepEqual(httpArgs, undefined);
  });

  it('test construct with state', function() {
    let sdb = client.clientInfo.stateDb;
    sdb['FFFFF'] = {};
    let resp = new AuthorizationResponse('code', 'FFFFF')
    sdb.addResponse(resp);
    let atr = new AccessTokenResponse({
      'access_token': '2YotnFZFEjr1zCsicMWpAA',
      'token_type': 'example',
      'refresh_token': 'tGzv3JOkF0XG5Qx2TlKWIA',
      'example_parameter': 'example_value',
      'scope': ['inner', 'outer']
    });
    sdb.addResponse(atr, {'state': 'FFFFF'});
    let cis = new ResourceRequest();
    let list = new BearerBody().construct(
        cis, client.clientInfo, {}, null, {'state': 'FFFFF'}, 'inner');
    let httpArgs = list[0];
    cis = list[1];
    assert.deepEqual(cis['access_token'], '2YotnFZFEjr1zCsicMWpAA');
    assert.deepEqual(httpArgs, null);
  });

  it('test construct with request', function() {
    let sdb = client.clientInfo.stateDb;
    sdb['EEEE'] = {};
    let resp = new AuthorizationResponse('auth_grant', 'EEEE');
    new client.service['Authorization']().parseResponse(
        resp, client.clientInfo, 'urlencoded');

    let resp2 = new AccessTokenResponse({
      'access_token': 'token1',
      'token_type': 'Bearer',
      'expires_in': 0,
      'state': 'EEEE'
    });
    new client.service['AccessToken']().parseResponse(
        resp2, client.clientInfo, 'urlencoded');
    let cis = new ResourceRequest();
    let list = new BearerBody().construct(
        cis, client.clientInfo, null, null, {'state': 'EEEE'});
    let httpArgs = list[0];
    cis = list[1];
    assert.isTrue(Object.keys(cis).indexOf('access_token') !== -1);
    assert.deepEqual(cis['access_token'], 'token1');
  });
});

describe('Test client secret post', function() {
  var client;
  beforeEach(function() {
    client = getClient();
  });
  it('test construct', function() {
    let request = new client.service['AccessToken']().construct(
        client.clientInfo, null,
        {'redirect_uri': 'http://example.com', 'state': 'ABCDE'});
    let csp = new ClientSecretPost();
    let list = csp.construct(request, client.clientInfo);
    let httpArgs = list[0];
    request = list[1];

    assert.deepEqual(request['client_id'], 'A');
    assert.deepEqual(request['client_secret'], 'boarding pass');
    assert.deepEqual(httpArgs, undefined);

    let request2 = new AccessTokenRequest(
        {'code': 'foo', 'redirect_uri': 'http://example.com'});
    let list2 = csp.construct(
        request2, client.clientInfo, null, {'client_secret': 'another'});
    let httpArgs2 = list2[0];
    request2 = list2[1];
    assert.deepEqual(request2['client_id'], 'A');
    assert.deepEqual(request2['client_secret'], 'another');
    assert.deepEqual(httpArgs2, {});
  });
});

describe('Test valid client info', function() {
  let now = 123456;

  it('test valid client info works', function() {
    assert.isTrue(validClientInfo({}, now));
    assert.isTrue(
        validClientInfo({'client_id': 'test', 'client_secret': 'secret'}, now));
    assert.isTrue(validClientInfo({'client_secret_expires_at': 0}, now));
    assert.isTrue(validClientInfo({'client_secret_expires_at': 123460}, now));
    assert.isTrue(validClientInfo(
        {'client_id': 'test', 'client_secret_expires_at': 123460}, now));
    assert.isFalse(validClientInfo({'client_secret_expires_at': 1}, now));
    assert.isFalse(validClientInfo(
        {'client_id': 'test', 'client_secret_expires_at': 123455}, now));
  });
});