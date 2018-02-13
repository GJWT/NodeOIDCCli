const Service = require('../../service');
const Token = require('../../../oicMsg/src/models/tokenProfiles/token');
const Authorization = require('./authorization').Authorization;
const AccessToken = require('./accessToken').AccessToken;
const CheckId = require('./checkId').CheckID;
const CheckSession = require('./checkSession').CheckSession;
const EndSession = require('./endSession').EndSession;
const ProviderInfoDiscovery =
    require('./providerInfoDiscovery').ProviderInfoDiscovery;
const RefreshAccessToken = require('./refreshAccessToken').RefreshAccessToken;
const Registration = require('./registration').Registration;
const UserInfo = require('./userInfo').UserInfo;

const PREFERENCE2PROVIDER = {
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

let PROVIDER2PREFERENCE = {};

for (let i = 0; i < Object.keys(PREFERENCE2PROVIDER).length; i++) {
  let k = Object.keys(PREFERENCE2PROVIDER)[i];
  let v = PREFERENCE2PROVIDER[k];
  PROVIDER2PREFERENCE[k] = v;
};

const PROVIDER_DEFAULT = {
  'token_endpoint_auth_method': 'client_secret_basic',
  'id_token_signed_response_alg': 'RS256',
};

var services = {
  'AccessToken': AccessToken,
  'Authorization': Authorization,
  'CheckId': CheckId,
  'CheckSession': CheckSession,
  'EndSession': EndSession,
  'ProviderInfoDiscovery': ProviderInfoDiscovery,
  'RefreshAccessToken': RefreshAccessToken,
  'Registration': Registration,
  'Service': Service,
  'UserInfo': UserInfo
};

function OicFactory(reqName, httpLib, keyJar, clientAuthnMethod) {
  for (let i = 0; i < Object.keys(services).length; i++) {
    let key = Object.keys(services)[i];
    let val = services[key];
    if (key === reqName) {
      if (val.prototype.init) {
        val.prototype.init(httpLib, keyJar, clientAuthnMethod);
      }
      return val;
    }
  }
}

module.exports.OicFactory = OicFactory;