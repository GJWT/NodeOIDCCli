
const AccessToken = require('./accessToken').AccessToken;
const Authorization = require('./authorization').Authorization;
const ProviderInfoDiscovery =
    require('./providerInfoDiscovery').ProviderInfoDiscovery;
const RefreshAccessToken = require('./refreshAccessToken').RefreshAccessToken;

var services = {
  'AccessToken': AccessToken,
  'Authorization': Authorization,
  'ProviderInfoDiscovery': ProviderInfoDiscovery,
  'RefreshAccessToken': RefreshAccessToken
};

function postXParseResponse(resp, cliInfo, state) {
  state = state || '';
  cliInfo.stateDb.addResponse(resp, state);
}

function getState(requestArgs, kwargs) {
  let state = null;
  if (kwargs && kwargs['state']) {
    state = kwargs['state'];
  } else {
    if (requestArgs['state']) {
      state = requestArgs['state'];
    }
  }
  return state;
}

function Factory(reqName, httpLib, keyJar, clientAuthnMethod) {
  for (let i = 0; i < Object.keys(services).length; i++) {
    let key = Object.keys(services)[i];
    let val = services[key];
    if (key === reqName) {
      val.prototype.init(httpLib, keyJar, clientAuthnMethod);
      return val;
    }
  }
}

module.exports.postXParseResponse = postXParseResponse;
module.exports.getState = getState;
module.exports.Factory = Factory;