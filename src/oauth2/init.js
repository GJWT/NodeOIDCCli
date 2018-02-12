var CLIENT_AUTHN_METHOD = require('../clientAuth').CLIENT_AUTHN_METHOD;
var ClientInfo = require('../clientInfo.js');
var Factory = require('../oauth2/service').Factory;
var HTTPLib = require('../http').HTTPLib;
var KeyJar = require('../../oicMsg/src/models/keystore-dependency/KeyJar');
var OicCliError = require('../exception').OicCliError;
var Service = require('../service');
var service = require('../oauth2/service');

var DEFAULT_SERVICES = [
  'Authorization', 'AccessToken', 'RefreshAccessToken', 'ProviderInfoDiscovery'
];

ExpiredToken.prototype = new OicCliError();
ExpiredToken.prototype = Object.create(OicCliError.prototype);
ExpiredToken.prototype.constructor = ExpiredToken;

function ExpiredToken() {
  OicCliError.call();
};

function buildServices(srvs, serviceFactory, kwargs) {
  var http = kwargs['httpLib'];
  var keyJar = kwargs['keyjar'];
  var clientAuthnMethod = kwargs['clientAuthnMethod'];
  var service = {};
  for (var i = 0; i < srvs.length; i++) {
    var serv = srvs[i];
    var srv = serviceFactory(serv, http, keyJar, clientAuthnMethod);
    var name = srv.prototype.request || srv.name;
    service[name] = srv;
    var newServ = new Service();
    service['any'] = newServ.init(http, keyJar, clientAuthnMethod);
  }
  return service;
};

function Client() {};

/**
 * :param ca_certs: Certificates used to verify HTTPS certificates
 * :param client_authn_method: Methods that this client can use to
        authenticate itself. It's a dictionary with method names as
        keys and method classes as values.
 * :param verify_ssl: Whether the SSL certificate should be verified.
 * :return: Client instance
 */
Client.prototype.init = function(
    clientAuthnMethod, config, caCerts, keyjar, verifySsl, clientCert, httpLib,
    services, serviceFactory) {
  caCerts = caCerts || null;
  clientAuthnMethod = clientAuthnMethod || null;
  keyjar = keyjar || null;
  verifySsl = verifySsl || true;
  config = config || null;
  clientCert = clientCert || null;
  httpLib = httpLib || null;
  services = services || null;
  serviceFactory = serviceFactory || null;

  this.http = httpLib || new HTTPLib(caCerts, verifySsl, clientCert, keyJar);

  if (!keyJar) {
    var keyJar = new KeyJar();
  }

  this.events = null;
  var clientInfo = new ClientInfo();
  this.clientInfo = clientInfo.init(keyJar, config);
  if (this.clientInfo.clientId) {
    this.clientId = this.clientInfo.clientId;
  }
  var cam = clientAuthnMethod || CLIENT_AUTHN_METHOD;
  this.serviceFactory = serviceFactory || Factory;
  var srvs = services || DEFAULT_SERVICES;
  this.service = buildServices(
      srvs, this.serviceFactory,
      {'httpLib': this.http, 'keyjar': keyJar, 'clientAuthnMethod': cam});
  this.clientInfo.service = this.service;
  this.verifySsl = verifySsl;
};

Client.prototype.construct = function(
    requestType, requestArgs, extraArgs, kwargs) {
  requestArgs = requestArgs || null;
  extraArgs = extraArgs || null;

  try {
    this.service[requestType];
  } catch (err) {
    console.log(requestType);
  }

  var met = this.getAttr('construct_{}_request'.format(requestType));
  return met(this.clientInfo, requestArgs, extraArgs, kwargs);
};

Client.prototype.doRequest = function(
    requestType, scope, responseBodyType, method, requestArgs, extraArgs,
    httpArgs, authnMethod, kwargs) {
  scope = scope || '';
  responseBodyType = responseBodyType || '';
  method = method || '';
  requestArgs = requestArgs || null;
  extraArgs = extraArgs || null;
  httpArgs = httpArgs || null;
  authnMethod = authnMethod | '';

  var srv = this.service[requestType];
  if (!method) {
    method = srv.httpMethod;
  }
  var info = srv.doRequestInit(
      this.clientInfo, method, scope, requestArgs, extraArgs, authnMethod,
      httpArgs, kwargs);

  if (!responseBodyType) {
    responseBodyType = srv.responseBodyType;
  }

  var body = null;
  try {
    body = info['body'];
  } catch (err) {
    console.log(err);
    vbody = null;
  }
  return srv.serviceRequest(
      info['uri'], method, body, requestBodyType, info['httpArgs'],
      this.clientInfo, kwargs);
};

Client.prototype.setClientId = function(clientId) {
  this.clientId = clientId;
  this.clientInfo.clientId = clientId;
};

module.exports.ExpiredToken = ExpiredToken;
module.exports.Client = Client;