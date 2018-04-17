
const AccessToken = require('./accessToken').AccessToken;
const Authorization = require('./authorization').Authorization;
const ProviderInfoDiscovery =
    require('./providerInfoDiscovery').ProviderInfoDiscovery;
const RefreshAccessToken = require('./refreshAccessToken').RefreshAccessToken;

function postXParseResponse(resp, serviceContext, state) {
  state = state || '';
  serviceContext.stateDb.addResponse(resp, state);
}

function getState(requestArgs, params) {
  let state = null;
  if (params && params['state']) {
    state = params['state'];
  } else {
    if (requestArgs['state']) {
      state = requestArgs['state'];
    }
  }
  return state;
}

function setStateParameter(requestArgs=null, params){
  requestArgs['state'] = getStateParameter(requestArgs, params);
  let list = [requestArgs, {'state': requestArgs['state']}];
  return list;
}

function pickRedirectUris(requestArgs=null, service=null, params){
  let _context = service.serviceContext;
  if (Object.keys(requestArgs).indexOf('redirect_uri')){
    pass;
  }else if (_context.callback){
    if (requestArgs['response_type']){
      _responseType = requestArgs['response_type'];
    }else{
      _responseType = context.behavior['response_types'][0];
      requestArgs['response_type'] = _responseType;
    }

    if (requestArgs['response_mode']){
      _responseMode = requestArgs['response_mode'];
    }else{
      _responseMode = '';
    }

    if (_responseMode === 'form_post'){
      requestArgs['redirect_uri'] = _context.callback['form_post'];
    }else if (_responseType === 'code'){
      requestArgs['redirectUri'] = _context.callback['code'];
    }else{
      requestArgs['redirectUri'] = _context.callback['implicit'];
    }
  }else{
    requestArgs['redirect_uri'] = _context.redirect_uris[0];
  }
  let list = [requestArgs, {}];
  return list;
}

var services = {
  'AccessToken': AccessToken,
  'Authorization': Authorization,
  'ProviderInfoDiscovery': ProviderInfoDiscovery,
  'RefreshAccessToken': RefreshAccessToken
};

function Factory(reqName, serviceContext, stateDb, clientAuthnMethod, serviceConfiguration) {
  for (let i = 0; i < Object.keys(services).length; i++) {
    let key = Object.keys(services)[i];
    let val = services[key];
    if (key === reqName) {
      return new val(serviceContext, stateDb, clientAuthnMethod, serviceConfiguration);
    }
  }
}

module.exports.postXParseResponse = postXParseResponse;
module.exports.getState = getState;
module.exports.Factory = Factory;