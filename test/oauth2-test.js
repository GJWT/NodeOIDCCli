var AccessTokenRequest = require('../oicMsg/oauth2/init.js').AccessTokenRequest;
var AccessTokenResponse = require('../oicMsg/oauth2/init.js').AccessTokenResponse;
var assert = require('chai').assert;
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

var CLIENT_CONF = {'issuer': 'https://example.com/as',
'redirect_uris': ['https://example.com/cli/authz_cb'],
'client_secret': 'boarding pass',
'client_id': CLIENT_ID};

var CLIENT_ID = "A";

var REQ_ARGS = {'redirect_uri': 'https://example.com/rp/cb', 'response_type': "code"};

function getClient(){
    var redirect_uri = "http://example.com/redirect";
    var conf = {
        'redirect_uris': ['https://example.com/cli/authz_cb'],
        'client_id': 'client_1',
        'client_secret': 'abcdefghijklmnop'
    }
    var client = new Client();
    client.init(CLIENT_AUTHN_METHOD, conf);
    return client;
};

describe('Test client', function () {
    var client = getClient();
 
    it('test construct authorization request', function () {
        var requestArgs = {'state': 'ABCDE',
        'redirect_uri': 'https://example.com/auth_cb',
        'response_type': ['code']};
        
        var msg = client.service['authorization'].prototype.construct(client.clientInfo, requestArgs);
        assert.deepEqual(msg['client_id'], 'client_1');
        assert.deepEqual(msg['redirect_uri'], 'https://example.com/auth_cb');
    });

    it('test construct authorization request', function () {
        var reqArgs = {};
        client.clientInfo.stateDb['ABCDE'] = {'code' : 'access_code'};
        var msg = client.service['accessToken'].prototype.construct(client.clientInfo, reqArgs, {'state':'ABCDE'});
        assert.deepEqual(msg['code'], 'access_code');
        assert.deepEqual(msg['grant_type'], 'authorization_code');
        assert.deepEqual(msg['client_secret'], 'abcdefghijklmnop');
        assert.deepEqual(msg['client_id'], 'client_1');
    });
    
    it('test construct authorization request', function () {
        client.clientInfo.stateDb['ABCDE'] = {'code': 'access_code'};
        var resp = new AccessTokenResponse({'refresh_token':'refresh_with_me','access_token':'access'});
        client.clientInfo.stateDb.addResponse(resp, 'ABCDE');
        var reqArgs = {};
        var msg = client.service['refresh_token'].prototype.construct(client.clientInfo, reqArgs, {'state':'ABCDE'});
        assert.deepEqual(msg['refresh_token'], 'refresh_with_me');
        assert.deepEqual(msg['grant_type'], 'refresh_token');
        assert.deepEqual(msg['client_secret'], 'abcdefghijklmnop');
        assert.deepEqual(msg['client_id'], 'client_1');
    });
});