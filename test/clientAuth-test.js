var AccessTokenResponse = require('../oicMsg/oauth2/init').AccessTokenResponse;
var CLIENT_AUTHN_METHOD = require('../src/clientAuth').CLIENT_AUTHN_METHOD;
var ClientSecretBasic  = require('../src/clientAuth').ClientSecretBasic;
var Client  = require('../src/oauth2/service').Client;

var REQ_ARGS = {'redirect_uri': 'https://example.com/rp/cb', 'response_type': "code"};
var CLIENT_ID = "A";

var CLIENT_CONF = {'issuer': 'https://example.com/as',
               'redirect_uris': ['https://example.com/cli/authz_cb'],
               'client_secret': 'boarding pass',
               'client_id': CLIENT_ID};

function client(){
    var client = new Client(CLIENT_AUTHN_METHOD, CLIENT_CONF);
    var sdb = client.clientInfo.stateDb;
    sdb['ABCDE'] = {'code' : 'accessCode'};
    client.clientInfo.clientSecret = 'boardingPass';
    return client;
}
describe('Test client secret basic', function () {
    var client = client();
    var cis = client.service['accesstoken'].construct(client.clientInfo, "http://example.com", 'ABCDE');
    var csb = new ClientSecretBasic();
    var httpArgs = csb.construct(cis, client.clientInfo);

 
    it('test construct', function () {
        console.log(httpArgs);
        //assert.deepEqual(httpArgs, {'headers': {'Authorization': 'Basic QTpib2FyZGluZyBwYXNz'}});
    });
});