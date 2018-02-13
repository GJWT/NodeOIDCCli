const Token = require('../oicMsg/src/models/tokenProfiles/token');
const ErrorResponse = require('../oicMsg/oauth2/init').ErrorResponse;
const HttpLib = require('./http');
const AuthorizationResponse =
    require('../oicMsg/oauth2/init.js').AuthorizationResponse;
const util = require('./util').Util;

/**
 * @fileoverview Method call structure for Services
 * do_request_init
 *  - request_info
 *  - construct
 *      - pre_construct (*)
 *      - parse_args
 *      - post_construct (*)
 *  - init_authentication_method
 *  - uri_and_body
 *      - _endpoint
 *  - update_http_args
 *
 * service_request
 *   - parse_request_response
 *      - parse_response
 *         - get_urlinfo
 *              - post_parse_response (*)
 *      - parse_error_mesg
 *
 * The methods marked with (*) are where service specific
 * behaviour is implemented.
 */

let SUCCESSFUL = [200, 201, 202, 203, 204, 205, 206];
let SPECIAL_ARGS = ['authn_endpoint', 'algs'];
let REQUEST_INFO =
    'Doing request with: URL:{}, method:{}, data:{}, https_args:{}';

class Service {
  constructor() {
    this.msgType = Token;
    this.responseCls = Token;
    this.errorMsg = ErrorResponse;
    this.endpointName = '';
    this.synchronous = true;
    this.request = '';
    this.defaultAuthMethod = '';
    this.httpMethod = 'GET';
    this.bodyType = 'urlEncoded';
    this.responseBodyType = 'json';

    this.events = null;
    this.endpoint = '';
    this.defaultRequestArgs = {};

    // pull in all the modifiers
    this.preConstruct = [];
    this.postConstruct = [];
    this.postParseResponse = [];
  }

  init(httpLib, keyJar, clientAuthMethod, kwargs) {
    this.httpLib = httpLib || null;
    this.keyJar = keyJar || null;
    this.clientAuthMethod = clientAuthMethod || null;
  }

  /**
   * Go through the attributes that the message class can contain and
   * add values if they are missing and exists in the client info or
   * when there are default values.
   *
   * @param {*} cliInfo Client info
   * @param {*} kwargs Initial set of attributes.
   */

  parseArgs(cliInfo, kwargs) {
    let arArgs = kwargs;
    let self = this;
    for (let i = 0; i < Object.keys(this.msgType.prototype.cParam).length;
         i++) {
      let prop = Object.keys(this.msgType.prototype.cParam)[i];
      if (Object.keys(arArgs).indexOf(prop) !== -1) {
        continue;
      } else {
        if (cliInfo[prop]) {
          arArgs[prop] = cliInfo[prop];
        } else if (this.defaultRequestArgs[prop]) {
          arArgs[prop] = this.defaultRequestArgs[prop];
        }
      }
    }
    return arArgs;
  }

  /**
   *  Will run the pre_construct methods one at the time in order.
   *  @param {*} cliInfo Client Information as a :py:class:`oiccli.Client`
   *          instance.
   *  @param {*} requestArgs Request arguments
   *  @param {*} kwargs Extra key word arguments
   */
  doPreConstruct(cliInfo, requestArgs, kwargs) {
    let postArgs = {};
    let pair = null;
    for (let i = 0; i < this.preConstruct.length; i++) {
      let meth = this.preConstruct[i];
      pair = meth(cliInfo, requestArgs, kwargs);
    }
    return pair;
  }

  /**
   * Will run the post_construct methods one at the time in order
   * @param {*} cliInfo Client Information as a oiccli Client instance
   * @param {*} requestArgs Request arguments
   * @param kwargs Extra key word arguments
   */
  doPostConstruct(cliInfo, requestArgs, postArgs) {
    let pair = null;
    for (let i = 0; i < this.postConstruct.length; i++) {
      let meth = this.postConstruct[i];
      requestArgs = meth(cliInfo, requestArgs, postArgs);
    }
    return requestArgs;
  }

  /**
   *  A method run after the response has been parsed and verified.
   *  @param {*} resp The response as a Message instance
   *  @param {*} cliInfo Client Information as a Client instance.
   *  @param {*} state State value
   *  @param {*} kwargs Extra key word arguments
   */
  doPostParseResponse(resp, cliInfo, state, kwargs) {
    state = state || '';
    for (let i = 0; i < this.postParseResponse.length; i++) {
      let meth = this.postParseResponse[i];
      meth(resp, cliInfo, state, kwargs);
    }
  }

  setUp() {
    console.log('Unsupported');
  }

  /**
   * Instantiate the request as a message class instance
   * @param cliInfo Information about the client
   * @param requestArgs
   * @param kwargs Extra keyword arguments
   */
  construct(cliInfo, requestArgs, kwargs) {
    if (requestArgs == null) {
      requestArgs = {};
    }
    let pair = this.doPreConstruct(cliInfo, requestArgs, kwargs);
    requestArgs = pair[0];
    let postArgs = pair[1];
    if (this.msgType &&
        Object.keys(this.msgType.prototype.cParam).indexOf('state')) {
      if (kwargs && kwargs['state']) {
        delete kwargs['state'];
      }
    }
    let args = null;
    try {
      args = this.gatherRequestArgs(cliInfo, requestArgs);
    } catch (err) {
      args = this.parseArgs(cliInfo, requestArgs);
    }
    if (this.msgType.prototype.cDefault) {
      args = Object.assign({}, this.msgType.prototype.cDefault, args);
    }
    return this.doPostConstruct(cliInfo, args, postArgs);
  }

  getEndpoint(kwargs) {
    let uri = '';
    uri = kwargs['endpoint'];
    if (uri) {
      delete kwargs['endpoint'];
    }
    if (!uri) {
      try {
        uri = this.endpoint;
      } catch (err) {
        console.log('No endpoint specified');
      }
    }
    return uri;
  }

  uriAndBody(cis, method, kwargs) {
    method = method || 'POST';

    let uri = this.getEndpoint(kwargs);

    let resp = util.prototype.getOrPost(uri, method, cis, null, null, kwargs);
    resp['cis'] = cis;
    try {
      resp['httpArgs'] = {'headers': kwargs['headers']};
    } catch (err) {
      console.log('KeyError');
    }
    return resp;
  }

  initAuthenticationMethod(
      cis, cliInfo, authMethod, requestArgs, httpArgs, kwargs) {
    if (httpArgs == null) {
      httpArgs = {};
    }
    if (requestArgs == null) {
      requestArgs = {};
    }
    if (authMethod) {
      return this.clientAuthMethod[authMethod].prototype.construct(
          cis, cliInfo, requestArgs, httpArgs, kwargs);
    } else {
      return httpArgs;
    }
  }

  /**
   * The method where everything is setup for sending the request.
   * The request information is gathered and the where and how of sending the
   * request is decided.
   * @param {*} cliInfo Client information as a oicCli Client instance
   * @param {*} method The HTTP method to be used
   * @param {*} bodyType If the request is sent in the HTTP body this decides the encoding of the request
   * @param {*} authnMethod The client authentication method
   * @param {*} lax If it should be allowed to send a request that doesn't completely conform to the standard
   * @param {*} kwargs Extra keyword arguments
   */
  requestInfo(cliInfo, method, requestArgs, bodyType, authMethod, lax, kwargs) {
    if (!method) {
      method = this.httpMethod;
    }

    if (requestArgs == null) {
      requestArgs = {};
    }

    let args = {};
    for (let i = 0; i < Object.keys(kwargs).length; i++) {
      let k = Object.keys(kwargs)[i];
      let v = kwargs[k];
      if (SPECIAL_ARGS.indexOf(v) == -1 && SPECIAL_ARGS.indexOf(k) == -1) {
        args[k] = v;
      }
    }

    let cis = this.construct(cliInfo, requestArgs, args);

    if (this.events) {
      this.events.store('Protocol request', cis);
    }

    if (cis && lax) {
      cis.lax = lax;
    }

    let hArg = null;

    if (authMethod) {
      hArg =
          this.initAuthenticationMethod(cis, cliInfo, authMethod, null, kwargs);
    }

    if (hArg) {
      if (Object.keys(kwargs).indexOf('headers') !== -1) {
        kwargs['headers'] += hArg['headers'];
      } else {
        kwargs['headers'] = hArg['headers'];
      }
    }

    if (bodyType == 'json') {
      kwargs['contentType'] = JSON;
    }

    return this.uriAndBody(cis, method, kwargs);
  }

  /**
   * Extending the header with information gathered during the request setup.
   * @param {*} httpArgs Original HTTP header arguments
   * @param {*} info Request info
   */
  updateHttpArgs(httpArgs, info) {
    let hArgs = null;
    try {
      hArgs = info['httpArgs'];
    } catch (err) {
      hArgs = {};
    }

    if (httpArgs == null) {
      httpArgs = hArgs;
    } else {
      httpArgs = info['httpArgs'];
    }

    info['httpArgs'] = httpArgs;
    return info;
  }

  /**
   * Builds the request message and constructs the HTTP headers.
   * @param {*} cliInfo Client information
   * @param {*} bodyType Which serialization to use for the HTTP body
   * @param {*} method HTTP method used
   * @param {*} requestArgs Message arguments
   * @param {*} httpArgs Initial HTTP header arguments
   * @param {*} kwargs Extra keyword arguments
   */
  doRequestInit(
      cliInfo, bodyType, method, authMethod, requestArgs, httpArgs, kwargs) {
    if (!method) {
      method = this.httpMethod;
    }
    if (!authMethod) {
      authMethod = this.defaultAuthnMethod;
    }
    if (!bodyType) {
      bodyType = this.bodyType;
    }
    let info = this.requestInfo(
        cliInfo, method, requestArgs, bodyType, authMethod, httpArgs, kwargs);
    return this.updateHttpArgs(httpArgs, info);
  }

  /************************ RESPONSE HANDLING *************************/

  getUrlInfo(info) {
    let parts = null;
    if ((info instanceof String)) {
      if (info.indexOf('?') !== -1 || info.indexOf('#') !== -1) {
        parts = this.urlParse(info);
        let scheme = parts[0];
        let netloc = parts[1];
        let path = parts[2];
        let params = parts[3];
        let query = parts[4];
        let fragment = parts[5];
        if (query) {
          info = query;
        } else {
          info = fragment;
        }
      }
    }
    return info;
  }

  /**
   * Parse a response
   * @param {*} info The response, can be either in a JSON or an urlencoded format
   * @param {*} clientInfo Information about client and server
   * @param {*} sformat Which serialization that was used
   * @param {*} state The state
   * @param {*} kwargs Extra key word arguments
   */
  parseResponse(info, clientInfo, sformat, state, kwargs) {
    if (sformat == 'urlencoded') {
      info = this.getUrlInfo(info);
    }

    if (this.events) {
      this.events.store('Response', info);
    }

    let resp = null;
    try {
      if (sformat === 'urlencoded') {
        let responseObj = this.responseCls;
        resp = responseObj.prototype.fromUrlEncoded(info);
      }
    } catch (err) {
      console.log('Error while deserializing');
    }

    let msg = 'Initial response parsing';

    if (this.events) {
      this.events.store('Protocol Response', resp);
    }

    if (Object.keys(resp).indexOf('error') !== -1 &&
        !(resp instanceof ErrorResponse)) {
      resp = null;
      try {
        errMsgs = [this.errorMsg];
        if (errMsgs.indexOf(ErrorResponse) !== -1) {
          errMsgs.push(ErrorResponse);
        }
      } catch (err) {
        errMsgs = [ErrorResponse];
      }

      try {
        for (let i = 0; i < errMsgs.length; i++) {
          try {
            if (sformat === 'urlencoded') {
              resp = errMsg().prototype.fromUrlEncoded(info, sformat);
              resp.verify();
              break;
            }
          } catch (err) {
            resp = null;
          }
        }
      } catch (err) {
        console.log(err);
      }
    } else {
      if (!kwargs) {
        kwargs = {};
      }
      kwargs['client_id'] = clientInfo.client_id;
      kwargs['iss'] = clientInfo.issuer;

      if (Object.keys(kwargs).indexOf('key') !== -1 &&
          Object.keys(kwargs).indexOf('keyjar') !== -1) {
        kwargs['keyjar'] = this.keyjar;
      }

      try {
        let responseObj = this.responseCls;
        var verf = responseObj.prototype.verify(kwargs);
      } catch (err) {
        console.log(err);
      }

      if (!verf) {
        console.log('Verification of the response failed');
      }

      if (Object.keys(resp).indexOf('scope') !== -1) {
        try {
          resp['scope'] = kwargs['scope'];
        } catch (err) {
          console.log(err);
        }
      }
    }
    if (!resp) {
      console.log('Missing or faulty response');
    }

    try {
      this.doPostParseResponse(resp, clientInfo, state);
    } catch (err) {
      console.log(err);
    }
    return resp;
  }

  /**
   * Parse an error message.
   * @param {*} reqresp The response
   * @param {*} bodyType How the body is encoded
   */
  parseErrorMessage(reqresp, bodyType) {
    if (bodyType == 'txt') {
      bodyType = 'urlEncoded';
    } else {
      bodyType = bodyType;
    }
    err = this.errorMsg().deserialize(reqresp.text, bodyType);
    try {
      err.verify();
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  /**
   * Deal with a request response
   * @param {*} reqresp The HTTP request response
   * @param {*} clientInfo Information about the client/server session
   * @param {*} responseBodyType If response in body one of 'json', 'jwt' or
   *          'urlencoded'
   * @param {*} state Session identifier
   * @param {*} kwargs Extra keyword arguments
   */
  parseErrorMessage(reqresp, bodyType) {
    if (SUCCESSFUL.indexOf(reqresp.statusCode) !== -1) {
      valueType = this.getValueType(reqResp, responseBodyType);
    }
    try {
      return this.parseResponse(
          reqresp.text, clientInfo, valueType, state, kwargs);
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Get the encoding of the response
   * @param reqresp The response
   * @param bodyType Assumed body type
   */
  getValueType(reqresp, bodyType) {
    if (bodyType) {
      return verifyHeader(reqresp, bodyType);
    } else {
      return 'urlencoded';
    }
  }

  /**
   * Deal with a request response
   * @param {*} reqresp The HTTP request response
   * @param {*} clientInfo Information about the client/server session
   * @param {*} responseBodyType If response in body one of 'json', 'jwt' or
   *      'urlencoded'
   * @param {*} state Session identifier
   * @param {*} kwargs Extra keyword arguments
   */
  parseRequestResponse(reqresp, clientInfo, responseBodyType, state, kwargs) {
    responseBodyType = responseBodyType || '';
    state = state || '';
    let statusCodeArr = [302, 303];

    if (SUCCESSFUL.indexOf(reqresp.statusCode) !== -1) {
      valueType = this.getValueType(reqresp, responseBodyType);

      try {
        return this.parseResponse(
            reqresp.text, clientInfo, valueType, state, kwargs);
      } catch (err) {
        console.log(err);
      }
    } else if (reqresp.statusCodeArr.indexOf(reqresp.statusCode) !== -1) {
      return reqresp;
    } else if (reqresp.statusCode === 500) {
      console.log('Something went wrong');
    } else if (400 <= reqresp.statusCode < 500) {
      valueType = this.getValueType(reqresp, responseBodyType);
      let errResp = null;
      try {
        errResp = this.parseErrorMessage(reqresp, valueType);
      } catch (err) {
        return reqresp.text;
      }
      return errResp;
    } else {
      console.log('Error response');
    }
  }

  /**
   *  The method that sends the request and handles the response returned.
   *  This assumes a synchronous request-response exchange.
   *  @param {*} url The URL to which the request should be sent
   *  @param {*} response Response type
   *  @param {*} method Which HTTP method to use
   *  @param {*} body A message body if any
   *  @param {*} responseBodyType The expected format of the body of the return message
   *  @param http_args: Arguments for the HTTP client :return: A cls or
   *  ErrorResponse instance or the HTTP response instance if no response body
   *  was expected.
   */

  serviceRequest(reqresp, clientInfo, responseBodyType, state, kwargs) {
    if (httpArgs == null) {
      httpArgs = {};
    }
    try {
      resp = this.httpLib(url, method, data, httpArgs);
      data = data || body;
    } catch (err) {
      console.log('Exception on request');
    }
    if (kwargs.indexOf('keyjar') === -1) {
      kwargs['keyjar'] = this.keyjar;
    }
    if (!responseBodyType) {
      responseBodyType = this.responseBodyType;
    }
    return this.parseRequestResponse(
        resp, clientInfo, responseBodyType, kwargs);
  }
}

module.exports = Service;