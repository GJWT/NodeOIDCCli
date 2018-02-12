
var DEFAULT_SERVICES = [
  'Authorization', 'AccessToken', 'RefreshAccessToken', 'ProviderInfoDiscovery',
  'UserInfo', 'Registration'
];
var MAX_AUTHENTICATION_AGE = 86400;
var OAuth2Client = require('../oauth2/init').Client;
var OicFactory = require('../oic/service').OicFactory;

var PREFERENCE2PROVIDER = {
  'require_signed_request_object': 'request_object_algs_supported',
  'request_object_signing_alg': 'request_object_signing_alg_values_supported',
  'request_object_encryption_alg':
      'request_object_encryption_alg_values_supported',
  'request_object_encryption_enc':
      'request_object_encryption_enc_values_supported',
  'userinfo_signed_response_alg': 'userinfo_signing_alg_values_supported',
  'userinfo_encrypted_response_alg': 'userinfo_encryption_alg_values_supported',
  'userinfo_encrypted_response_enc': 'userinfo_encryption_enc_values_supported',
  'id_token_signed_response_alg': 'id_token_signing_alg_values_supported',
  'id_token_encrypted_response_alg': 'id_token_encryption_alg_values_supported',
  'id_token_encrypted_response_enc': 'id_token_encryption_enc_values_supported',
  'default_acr_values': 'acr_values_supported',
  'subject_type': 'subject_types_supported',
  'token_endpoint_auth_method': 'token_endpoint_auth_methods_supported',
  'token_endpoint_auth_signing_alg':
      'token_endpoint_auth_signing_alg_values_supported',
  'response_types': 'response_types_supported',
  'grant_types': 'grant_types_supported'
};

var PROVIDER2PREFERENCE = {};
for (var i = 0; i < Object.keys(PREFERENCE2PROVIDER).length; i++) {
  var k = Object.keys(PREFERENCE2PROVIDER)[i];
  var v = PREFERENCE2PROVIDER[k];
  PROVIDER2PREFERENCE[k] = v;
};

var PROVIDER_DEFAULT = {
  'token_endpoint_auth_method': 'client_secret_basic',
  'id_token_signed_response_alg': 'RS256',
};

Client.prototype = new OAuth2Client();
Client.prototype = Object.create(OAuth2Client.prototype);
Client.prototype.constructor = Client;

function Client() {
  OAuth2Client.call(this);
};

Client.prototype.init = function(
    caCerts, clientAuthnMethod, keyJar, verifySsl, config, clientCert, httpLib,
    services, serviceFactory) {
  caCerts = caCerts || null;
  clientAuthnMethod = clientAuthnMethod || null;
  keyJar = keyJar || null;
  verifySsl = verifySsl || true;
  config = config || null;
  clientCert = clientCert || null;
  httpLib = httpLib || null;
  services = services || null;
  serviceFactory = serviceFactory || null;

  var srvs = services || DEFAULT_SERVICES;
  serviceFactory = serviceFactory || OicFactory;
  OAuth2Client.prototype.init(
      clientAuthnMethod, config, caCerts, keyJar, verifySsl, clientCert,
      httpLib, srvs, serviceFactory);
};

module.exports.Client = Client;