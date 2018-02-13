const CLIENT_AUTHN_METHOD =
    require('../clientAuth/privateKeyJWT').CLIENT_AUTHN_METHOD;
const ClientInfo = require('../clientInfo.js');
const Factory = require('../oauth2/service/service').Factory;
const HTTPLib = require('../http').HTTPLib;
const KeyJar = require('../../oicMsg/src/models/keystore-dependency/KeyJar');
const OicCliError = require('../exception').OicCliError;
const Service = require('../service');

const DEFAULT_SERVICES = [
  'Authorization', 'AccessToken', 'RefreshAccessToken', 'ProviderInfoDiscovery'
];

function buildServices(srvs, serviceFactory, kwargs) {
  let http = kwargs['httpLib'];
  let keyJar = kwargs['keyJar'];
  let clientAuthnMethod = kwargs['clientAuthnMethod'];
  let service = {};
  for (let i = 0; i < srvs.length; i++) {
    let serv = srvs[i];
    let srv = serviceFactory(serv, http, keyJar, clientAuthnMethod);
    let name = srv.prototype.request || srv.name;
    service[name] = srv;
    let newServ = new Service();
    service['any'] = newServ.init(http, keyJar, clientAuthnMethod);
  }
  return service;
}

class Client {
  /**
   * @param {*} caCerts Certificates used to verify HTTPS certificates
   * @param {*} clientAuthnMethod Methods that this client can use to
          authenticate itself. It's a dictionary with method names as
          keys and method classes as values.
  * @param {*} verifySsl Whether the SSL certificate should be verified.
  */
  init(
      clientAuthnMethod, config, caCerts, keyJar, verifySsl, clientCert,
      httpLib, services, serviceFactory) {
    caCerts = caCerts || null;
    clientAuthnMethod = clientAuthnMethod || null;
    keyJar = keyJar || null;
    verifySsl = verifySsl || true;
    config = config || null;
    clientCert = clientCert || null;
    httpLib = httpLib || null;
    services = services || null;
    serviceFactory = serviceFactory || null;

    this.http = httpLib || new HTTPLib(caCerts, verifySsl, clientCert, keyJar);

    if (!keyJar) {
      let keyJar = new KeyJar();
    }

    this.events = null;
    let clientInfo = new ClientInfo();
    this.clientInfo = clientInfo.init(keyJar, config);
    if (this.clientInfo.clientId) {
      this.clientId = this.clientInfo.clientId;
    }
    let cam = clientAuthnMethod || CLIENT_AUTHN_METHOD;
    this.serviceFactory = serviceFactory || Factory;
    let srvs = services || this.getDefaultServices();
    this.service = buildServices(
        srvs, this.serviceFactory,
        {'httpLib': this.http, 'keyJar': keyJar, 'clientAuthnMethod': cam});
    this.clientInfo.service = this.service;
    this.verifySsl = verifySsl;
  }

  construct(requestType, requestArgs, extraArgs, kwargs) {
    requestArgs = requestArgs || null;
    extraArgs = extraArgs || null;
    try {
      this.service[requestType];
    } catch (err) {
      console.log(err);
    }
    let met = this.getAttr('construct_{}_request'.format(requestType));
    return met(this.clientInfo, requestArgs, extraArgs, kwargs);
  }

  doRequest(
      requestType, scope, responseBodyType, method, requestArgs, extraArgs,
      httpArgs, authnMethod, kwargs) {
    scope = scope || '';
    responseBodyType = responseBodyType || '';
    method = method || '';
    requestArgs = requestArgs || null;
    extraArgs = extraArgs || null;
    httpArgs = httpArgs || null;
    authnMethod = authnMethod | '';

    let srv = this.service[requestType];
    if (!method) {
      method = srv.httpMethod;
    }
    let info = srv.doRequestInit(
        this.clientInfo, method, scope, requestArgs, extraArgs, authnMethod,
        httpArgs, kwargs);

    if (!responseBodyType) {
      responseBodyType = srv.responseBodyType;
    }

    let body = null;
    try {
      body = info['body'];
    } catch (err) {
      console.log(err);
      vbody = null;
    }
    return srv.serviceRequest(
        info['uri'], method, body, requestBodyType, info['httpArgs'],
        this.clientInfo, kwargs);
  }

  setClientId(clientId) {
    this.clientId = clientId;
    this.clientInfo.clientId = clientId;
  }

  getDefaultServices() {
    return DEFAULT_SERVICES;
  }
}

module.exports.Client = Client;