var assert = require('chai').assert;
var AccessTokenRequest = require('../oicMsg/oauth2/init.js').AccessTokenRequest;
var AccessTokenResponse = require('../oicMsg/oauth2/init.js').AccessTokenResponse;
var AuthorizationRequest = require('../oicMsg/oauth2/init.js').AuthorizationRequest;
var AuthorizationResponse = require('../oicMsg/oauth2/init.js').AuthorizationResponse;
var BearerBody  = require('../src/clientAuth').BearerBody;
var BearerHeader  = require('../src/clientAuth').BearerHeader;
var CCAccessTokenRequest = require('../oicMsg/oauth2/init.js').CCAccessTokenRequest;
var Client = require('../src/oauth2/init').Client;
var CLIENT_AUTHN_METHOD = require('../src/clientAuth').CLIENT_AUTHN_METHOD;
var ClientSecretBasic  = require('../src/clientAuth').ClientSecretBasic;
var ClientSecretPost  = require('../src/clientAuth').ClientSecretPost;
var ResourceRequest = require('../oicMsg/oauth2/init.js').ResourceRequest;
var Service = require('../src/service').Service;
var validClientInfo  = require('../src/clientAuth').validClientInfo;

var CLIENT_ID = "A";

var CLIENT_CONF = {'issuer': 'https://example.com/as',
'redirect_uris': ['https://example.com/cli/authz_cb'],
'client_secret': 'boarding pass',
'client_id': CLIENT_ID};

var REQ_ARGS = {'redirect_uri': 'https://example.com/rp/cb', 'response_type': "code"};

function getClient(){
    var client = new Client();
    client.init(CLIENT_AUTHN_METHOD, CLIENT_CONF);
    var sdb = client.clientInfo.stateDb;
    sdb.dict = {};
    sdb.dict['ABCDE'] = {'code' : 'accessCode'};
    client.clientInfo.clientSecret = 'boardingPass';
    return client;
};

describe('Test client secret basic', function () {
    var client = getClient();
    var accessToken = new client.service['accessToken']();
    accessToken.init();
    var cis = accessToken.construct(client.clientInfo, {}, {'redirect_uri': 'http://example.com', 'state': 'ABCDE'});
    var csb = new ClientSecretBasic();
    var httpArgs = csb.construct(cis, client.clientInfo);
 
    it('test construct', function () {
        var credentialsDict = {};
        credentialsDict['A'] = 'boarding pass';
        var authorizationDict = {};
        authorizationDict['Authorization'] = credentialsDict;
        var headersDict = {};
        headersDict['headers'] = authorizationDict;
        assert.deepEqual(headersDict, httpArgs);
    });

    it('test does not remove padding', function () {
        var cis = new AccessTokenRequest({'code':"foo", 'redirect_uri':"http://example.com"})
        var csb = new ClientSecretBasic();
        var httpArgs = csb.construct(cis, client.client_info, null, null, {'user':"ab", 'password':"c"});
        //assert.isTrue(http_args["headers"]["Authorization"].endsWith("=="));
        var credentialsDict = {};
        credentialsDict['ab'] = 'c';
        var authorizationDict = {};
        authorizationDict['Authorization'] = credentialsDict;
        var headersDict = {};
        headersDict['headers'] = authorizationDict;
        assert.deepEqual(headersDict, httpArgs);
    });

    it('test construct cc', function () {
        var cis = new CCAccessTokenRequest({'grant_type':"client_credentials"})
        var csb = new ClientSecretBasic();
        var httpArgs = csb.construct(cis, client.client_info, null, null,
                                          {'user':"service1", 'password':"secret"})
        //assert http_args["headers"]["Authorization"].startswith('Basic ')
        var credentialsDict = {};
        credentialsDict['service1'] = 'secret';
        var authorizationDict = {};
        authorizationDict['Authorization'] = credentialsDict;
        var headersDict = {};
        headersDict['headers'] = authorizationDict;
        assert.deepEqual(headersDict, httpArgs);
    });
});

describe('Test bearer header', function () {
    var client = getClient();
    
    it('test construct', function () {
        var request = new ResourceRequest({"access_token": "Sesame"});        
        var bh = new BearerHeader();
        var httpArgs = bh.construct(request);
        var testDict = {"headers": {"Authorization": "Bearer Sesame"}};
        assert.deepEqual(testDict, httpArgs);
    });

    it('test construct with http args', function () {
        var request = new ResourceRequest({"access_token": "Sesame"});        
        var bh = new BearerHeader()
        var httpArgs = bh.construct(request, null,{"foo": "bar"})
        assert.deepEqual(Object.keys(httpArgs), ["foo", "headers"])
        var testDict = {"Authorization": "Bearer Sesame"};
        assert.deepEqual(testDict, httpArgs["headers"]);
    });

    it('test construct with headers in http args', function () {
        var request = new ResourceRequest({"access_token": "Sesame"});        
        var bh = new BearerHeader()
        var httpArgs = bh.construct(request, null, {"headers": {"x-foo": "bar"}});
        assert.deepEqual(Object.keys(httpArgs), ["headers"]);
        assert.deepEqual(Object.keys(httpArgs['headers']), ["x-foo", "Authorization"]);
        assert.deepEqual(httpArgs["headers"]["Authorization"], "Bearer Sesame");
    });

    it('test construct with resource request', function () {
        var bh = new BearerHeader();
        var cis = new ResourceRequest({'access_token':"Sesame"});
        var httpArgs = bh.construct(cis, client.clientInfo);
        assert.deepEqual(Object.keys(cis).indexOf('access_token'), -1);
        assert.deepEqual(httpArgs, {"headers": {"Authorization": "Bearer Sesame"}});
    });

    it('test construct with token', function () {
        client.clientInfo.stateDb['AAAA'] = {}
        var resp1 = new AuthorizationResponse("auth_grant", "AAAA");
        client.service['authorization'].prototype.parseResponse(resp1, client.clientInfo, "urlencoded")
        // based on state find the code and then get an access token
        var resp2 = new AccessTokenResponse({'access_token':"token1",
                                    'token_type':"Bearer", 'expires_in':0,
                                    'state':"AAAA"});
        client.service['accessToken'].prototype.parseResponse(resp2, client.clientInfo, "urlencoded")
        var httpArgs = new BearerHeader().construct(
            new ResourceRequest(), client.clientInfo, null, null, {'state':"AAAA"});
        assert.deepEqual(httpArgs, {"headers": {"Authorization": "Bearer token1"}});
    });
});

describe('Test bearer header', function () {
    var client = getClient();
    
    it('test construct with request args', function () {        
        var requestArgs = {"access_token": "Sesame"};
        var cis = new ResourceRequest();
        var list = new BearerBody().construct(cis, client.clientInfo, requestArgs);
        var httpArgs = list[0];
        cis = list[1];
        
        assert.deepEqual(cis["access_token"], "Sesame");
        assert.deepEqual(httpArgs, undefined);
    });

    it('test construct with state', function () {
        var sdb = client.clientInfo.stateDb;
        sdb['FFFFF'] = {}
        var resp = new AuthorizationResponse(code="code", state="FFFFF")
        sdb.addResponse(resp)
        var atr = new AccessTokenResponse({'access_token':"2YotnFZFEjr1zCsicMWpAA",
                                  'token_type':"example",
                                  'refresh_token':"tGzv3JOkF0XG5Qx2TlKWIA",
                                  'example_parameter':"example_value",
                                  'scope':["inner", "outer"]});
        sdb.addResponse(atr, state='FFFFF');
        var cis = new ResourceRequest();
        var list = new BearerBody().construct(
            cis, client.clientInfo, {}, null, "FFFFF", "inner")
        var httpArgs = list[0];
        var cis = list[1];
        assert.deepEqual(cis["access_token"], "2YotnFZFEjr1zCsicMWpAA");
        assert.deepEqual(httpArgs, null);
    });

    it('test construct with request', function () {
        var sdb = client.clientInfo.stateDb;
        sdb['EEEE'] = {};
        var resp = new AuthorizationResponse(code="auth_grant", state="EEEE");
        client.service['authorization'].prototype.parseResponse(resp, client.clientInfo, 'urlencoded');
        
        var resp2 = new AccessTokenResponse({'access_token':"token1",
                                  'token_type':"Bearer",
                                  'expires_in': 0,
                                  'state':'EEEE'});
        client.service['accessToken'].prototype.parseResponse(resp2, client.clientInfo, 'urlencoded');
        var cis = new ResourceRequest();
        var list = new BearerBody().construct(
            cis, client.clientInfo, null, null, "EEEE");
        var httpArgs = list[0];
        var cis = list[1];
        assert.isTrue(Object.keys(cis).indexOf('access_token') !== -1);
        assert.deepEqual(cis["access_token"], "token1");
    });
});

describe('Test client secret post', function () {
    var client = getClient();
    
    it('test construct', function () {    
        var request = client.service['accessToken'].prototype.construct(client.clientInfo, null, {'redirect_uri' : "http://example.com", 'state':'ABCDE'});
        var csp = new ClientSecretPost();
        var list = csp.construct(request, client.clientInfo);
        var httpArgs = list[0];
        request = list[1];
        
        assert.deepEqual(request['client_id'], 'A');
        assert.deepEqual(request['client_secret'], 'boarding pass');
        assert.deepEqual(httpArgs, undefined);
        
        var request2 = new AccessTokenRequest({'code':'foo', 'redirect_uri': 'http://example.com'});
        var list2 = csp.construct(request2, client.clientInfo, null, {'client_secret':'another'});
        var httpArgs2 = list2[0];
        request2 = list2[1];
        assert.deepEqual(request2['client_id'], 'A');
        assert.deepEqual(request2['client_secret'], 'another');
        assert.deepEqual(httpArgs2, {});
    });
});

describe('Test valid client info', function () {
    var _now = 123456;
    
    it('test valid client info works', function () {    
        assert.isTrue(validClientInfo({}, _now));
        assert.isTrue(validClientInfo({'client_id': 'test', 'client_secret': 'secret'}, _now));
        assert.isTrue(validClientInfo({'client_secret_expires_at': 0}, _now));
        assert.isTrue(validClientInfo({'client_secret_expires_at': 123460}, _now));
        assert.isTrue(validClientInfo({'client_id': 'test', 'client_secret_expires_at': 123460}, _now));
        assert.isFalse(validClientInfo({'client_secret_expires_at': 1}, _now));
        assert.isFalse(validClientInfo({'client_id': 'test', 'client_secret_expires_at': 123455}, _now));        
    });
});