var AccessTokenRequest = require('../oicMsg/oauth2/init.js').AccessTokenRequest;
var AccessTokenResponse = require('../oicMsg/oauth2/init.js').AccessTokenResponse;
var assert = require('chai').assert;
var AuthorizationRequest = require('../oicMsg/oauth2/init.js').AuthorizationRequest;
var AuthorizationResponse = require('../oicMsg/oauth2/init.js').AuthorizationResponse;
var BearerBody  = require('../src/clientAuth').BearerBody;
var BearerHeader  = require('../src/clientAuth').BearerHeader;
var CCAccessTokenRequest = require('../oicMsg/oauth2/init.js').CCAccessTokenRequest;
var Client = require('../src/oic/init').Client;
var CLIENT_AUTHN_METHOD = require('../src/clientAuth').CLIENT_AUTHN_METHOD;
var ClientInfo  = require('../src/clientInfo');
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
    client.init(CLIENT_AUTHN_METHOD);
    var ci = new ClientInfo();
    client.clientInfo = ci.init(null, conf);
    client.clientInfo.stateDb['ABCDE'] =  {'code': 'access_code'};
    return client;
};

describe('Test client', function () {
    var client = getClient();

    it('test construct accesstoken request', function () {
        var reqArgs = {};
        var msg = client.service['accessToken'].prototype.construct(client.clientInfo, reqArgs, {'state':'ABCDE'});
        assert.deepEqual(msg['code'], 'access_code');
        assert.deepEqual(msg['grant_type'], 'authorization_code');
        assert.deepEqual(msg['client_secret'], 'abcdefghijklmnop');
        assert.deepEqual(msg['client_id'], 'client_1');
    });
    
    it('test construct refreshtoken request', function () {
        var resp = new AccessTokenResponse({'refresh_token':'refresh_with_me','access_token':'access'});
        client.clientInfo.stateDb.addResponse(resp, 'ABCDE');
        var reqArgs = {};
        var msg = client.service['refresh_token'].prototype.construct(client.clientInfo, reqArgs, {'state':'ABCDE'});
        assert.deepEqual(msg['refresh_token'], 'refresh_with_me');
        assert.deepEqual(msg['grant_type'], 'refresh_token');
        assert.deepEqual(msg['client_secret'], 'abcdefghijklmnop');
        assert.deepEqual(msg['client_id'], 'client_1');
    });

    it('test construct userinfo request init', function () {
        var resp = new AccessTokenResponse({'refresh_token':"refresh_with_me",
        'access_token':"access"});
        client.clientInfo.stateDb.addResponse(resp, "ABCDE");
        
        var srv = client.service['UserInfo'];
        srv.prototype.endpoint = 'https://example.com/userinfo';
        var info = srv.prototype.doRequestInit(client.clientInfo, null, null, null, null, null, {'state' : 'ABCDE'});
        assert.isNotNull(info);
        assert.deepEqual(info['cis'], {});
        assert.deepEqual(info['httpArgs'], {'headers': {'Authorization': 'Bearer access'}});
    });
});