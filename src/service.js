
var HttpError = require('./exception').HttpError;
var MissingEndpoint = require('./exception').MissingEndpoint;
var OicCliError = require('./exception').OicCliError;
var ParseError = require('./exception').ParseError;
var ResponseError = require('./exception').ResponseError;
var verifyHeader = require('./util').verifyHeader;
var getOrPost = require('./util').getOrPost;
var JSONEncoded = require('./util').JSONEncoded;
var AuthorizationErrorResponse = require('./oauth2/service').AuthorizationErrorResponse;
var Message = require('./oauth2/service').Message;
var ErrorResponse = require('./oauth2/service').ErrorResponse;
var TokenErrorResponse = require('./oauth2/service').TokenErrorResponse; 

/**
 * method call structure for Services
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

var SUCCESSFUL = [200, 201, 202, 203, 204, 205, 206]
var RESPONSE2ERROR = {
    'AuthorizationResponse': [AuthorizationErrorResponse, TokenErrorResponse],
    'AccessTokenResponse': [TokenErrorResponse]
}
var SPECIAL_ARGS = ['authn_endpoint', 'algs']
var REQUEST_INFO='Doing request with: URL:{}, method:{}, data:{}, https_args:{}'


function Service(){
  this.msgType = Message;
  this.responseCls = Message;
  this.errorMsg = ErrorResponse;
  this.endpointName = '';
  this.synchronous = true;
  this.request = '';
  this.defaultAuthMethod = '';
  this.httpMethod = 'GET';
  this.bodyType = 'urlEncoded';
  this.responseBodyType = 'json';
};

Service.prototype.init = function(
    httplib, keyjar, client_authn_method, kwargs) {
    this.httpLib = httpLib || null;
    this.keyJar = keyJar || null;
    this.clientAuthMethod = clientAuthMethod || null;
    this.events = null;
    this.endpoint = '';
    this.defaultRequestArgs = {};

    // pull in all the modifiers
    this.preConstruct = [];
    this.postConstruct = [];
    this.postParseResponse = [];
    //this.setUp();
};

/**
 * Go through the attributes that the message class can contain and
 *      add values if they are missing and exists in the client info or
 *      when there are default values.
 * 
 *      :param cli_info: Client info
 *      :param kwargs: Initial set of attributes.
 *      :return: Possibly augmented set of attributes
 */

Service.prototype.parseArgs = function(cliInfo, kwargs){
  var arArgs = kwargs;

  for (var i = 0; i < this.msgType.cParam.keys(); i++){
      var prop = this.msgType.cParam.keys();
      if (arArgs.indexOf(prop) == -1){
          continue;
      }else{
          try{
              arArgs[prop] = this.getAttr(cliInfo, prop);
          }catch(err){
              try{
                  arArgs[prop] = this.defaultRequestArgs[prop];
              }catch(err){
                  console.log(err);
              }
          }
      }
  }
  return arArgs;
};

/**
 *  Will run the pre_construct methods one at the time in order.
 *      :param cli_info: Client Information as a :py:class:`oiccli.Client` 
 *          instance.
 *      :param request_args: Request arguments
 *      :param kwargs: Extra key word arguments
 *      :return: A tuple of request_args and post_args. post_args are to be
            used by the post_construct methods.
 */
Service.prototype.doPreConstruct = function(cliInfo, requestArgs, kwargs) {
  var postArgs = {};
  var pair = null;
  for (var i = 0; i < this.preConstruct.length; i++){
      var meth = this.preConstruct[i];
      pair = this.meth(cliInfo, requestArgs, kwargs);
      var postArgsUpdated  = pair[1];
      postArgs = postArgs
  }
  var requestArgs = pair[0];
  var updatedPair = [requestArgs, postArgs];
  return updatedPair;
};

/**
 * Will run the post_construct methods one at the time in order
 *  :param cli_info: Client Information as a :py:class:`oiccli.Client`
 *      instance.
 *  :param request_args: Request arguments
 *  :param kwargs: Extra key word arguments
 *  :return: request_args.
 */
Service.prototype.doPostConstruct = function(cliInfo, requestArgs, postArgs) {
    var pair = null;    
    for (var i = 0; i < this.preConstruct.length; i++){
        var meth = this.preConstruct[i];
        pair = this.meth(cliInfo, requestArgs, kwargs);
    }
    var requestArgs = pair[0];
    return requestArgs;    
}; 

/**
 *  A method run after the response has been parsed and verified.
 *      :param resp: The response as a :py:class:`oicmsg.Message` instance
 *      :param cli_info: Client Information as a :py:class:`oiccli.Client`
 *          instance.
 *      :param state: state value
 *      :param kwargs: Extra key word arguments
 */
Service.prototype.doPostParseResponse = function(resp, cliInfo, state, kwargs) {
    state = state || '';
    for (var i = 0; i < this.preConstruct.length; i++){
        var meth = this.preConstruct[i];
        this.meth(resp, cliInfo, state, kwargs);
    }    
};

Service.prototype.setUp = function() {
    console.log('Unsupported');
};

/**
 *   Instantiate the request as a message class instance
 *      :param cli_info: Information about the client
 *      :param request_args:
 *      :param kwargs: extra keyword arguments
 *      :return: message class instance
 */
Service.prototype.construct = function(cliInfo, requestArgs, kwargs) {
    if (requestArgs == null){
        requestArgs = {};
    }
    var pair = this.doPreConstruct(cliinfo, requestArgs, kwargs);

    if (this.msgType.cParam.indexOf('state')){
        try{
            delete kwargs['state'];
        }catch(err){
            console.log(err);
        }
    }

    var _args = this.parseArgs(cliInfo, requestArgs);
    var request = this.msgType(_args);
    return this.doPostConstruct(cliInfo, request, postArgs);
};

Service.prototype.endpoint = function(kwargs) {
    var uri = "";
    uri = kwargs['endpoint'];
    if (uri){
        delete kwargs['endpoint'];
    }
    if (!uri){
        try{
            uri = this.endpoint;
        }catch(err){
            console.log('No endpoint specified');
        }
    }
    return uri;
};    

Service.prototype.uriAndBody = function(cis, method, request_args, kwargs) {
    method = method || 'POST';
    requestArgs = requestArgs || null;

    var uri = this.endpoint(requestArgs);

    var resp = getOrPost(uri, method, cis, kwargs);
    resp['cis'] = cis;
    try{
        resp['hargs'] = {'headers': resp['headers']};
    }catch(err){
        console.log('KeyError');
    }
    return resp;
};    

/**
 *  Place the necessary information in the necessary places depending on
 *  client authentication method.
 *  :param cis: Message class instance
 *  :param cli_info: Client information
 *  :param authn_method: Client authentication method
 *  :param request_args: Message argument
 *  :param http_args: HTTP header arguments 
 *  :param kwargs: Extra keyword arguments  
 *  :return: Extended set of HTTP header arguments
 */
Service.prototype.initAuthenticationMethod = function(cis, cliInfo, authMethod, requestArgs, httpArgs, kwargs) {
   if (httpArgs == null){
       httpArgs = {};
   }
   if (requestArgs == null){
       requestArgs = {};
   }

   if (authMethod){
       return this.clientAuthMethod[authMethod]().construct(cis, cliInfo, requestArgs, httpArgs, kwargs);
   }else{
       return httpArgs;
   }
};   

/**
 * The method where everything is setup for sending the request.
 *      The request information is gathered and the where and how of sending the
 *      request is decided.
 *      :param cli_info: Client information as a :py:class:`oiccli.Client` instance
 *      :param method: The HTTP method to be used.
 *      :param request_args: Initial request arguments
 *      :param body_type: If the request is sent in the HTTP body this
 *          decides the encoding of the request
 *      :param authn_method: The client authentication method
 *      :param lax: If it should be allowed to send a request that doesn't
 *          completely conform to the standard.
 *      :param kwargs: Extra keyword arguments
 *      :return: A dictionary with the keys 'uri' and possibly 'body', 'kwargs',
 *          'cis' and 'ht_args'.
 */
Service.prototype.requestInfo = function(cliInfo, method, requestArgs, bodyType, authMethod, lax, kwargs) {
    if (!method){
        method = this.httpMethod;
    }

    if (requestArgs == null){
        requestArgs = {};
    }

    var args = null;
    for (var i = 0; i < kwargs.items(); i++){
        var pair = kwargs.items()[i];
        if (SPECIAL_ARGS.indexOf(v) == -1 && SPECIAL_ARGS.indexOf(k) == -1){
            args = (pair[0], pair[1]);
        }
    }

    cis = this.construct(cliInfo, requestArgs, _args);

    if (this.events){
        this.events.store('Protocol request', cis);
    }

    cis.lax = lax;
    var hArg = null;

    if (authMethod){
        hArg = this.initAuthenticationMethod(cis, cliInfo, authMethod, requestArgs, kwargs);
    }

    if (hArg){
        if (kwargs.keys().indexOf('headers')){
            kwargs['headers'].update(hArg['headers']);
        }else{
            kwargs['headers'] = hArg['headers'];
        }
    }

    if (bodyType == 'json'){
        kwargs['contentType'] = JSONEncoded;
    }

    return this.uriAndBody(cis, method, requestArgs, kwargs);
};    

/**
 *    Extending the header with information gathered during the request
 *      setup.
 *    :param http_args: Original HTTP header arguments
 *    :param info: Request info
 *    :return: Updated request info
 */
Service.prototype.updateHttpArgs = function(httpArgs, info) {
    var hArgs = null;
    try{
        hArgs = info['hArgs'];
    }catch(err){
        hArgs = {};
    }

    if (httpArgs == null){
        httpArgs = hArgs;
    }else{
        httpArgs.update(info['hArgs']);
    }

    info['httpArgs'] = httpArgs;
    return info;
};

/**
 *   Builds the request message and constructs the HTTP headers.
 *      :param cli_info: Client information
 *      :param body_type: Which serialization to use for the HTTP body
 *      :param method: HTTP method used.
 *      :param request_args: Message arguments
 *      :param http_args: Initial HTTP header arguments
 *      :param kwargs: extra keyword arguments
 *      :return: Dictionary with the necessary information for the HTTP
 *          request
 */
Service.prototype.doRequestInit = function(cliInfo, bodyType, method, authMethod, requestArgs, httpArgs, kwargs){
    if (!method){
        method = this.httpMethod;
    }
    if (!authMethod){
        authMethod = this.defaultAuthMethod;
    }
    if (!bodyType){
        bodyType = this.bodyType;
    }

    var info = this.requestInfo(cliInfo, method, bodyType, requestArgs, authMethod, kwargs);
    return this.updateHttpArgs(httpArgs, info);
};

/************************ RESPONSE HANDLLING *************************/

Service.prototype.getUrlInfo = function(info){
    var parts = null;
    if (info.indexOf('?') !== -1 || info.indexOf('#') !== -1){
        parts = this.urlParse(info);
        var scheme = parts[0];
        var netloc = parts[1];
        var path = parts[2];
        var params = parts[3];
        var query = parts[4];
        var fragment = parts[5];
        if (query){
            info = query;
        }else{
            info = fragment;
        }
    }
    return info;    
}; 

Service.prototype.postParseResponse = function(resp, clientInfo, state, kwargs){
    state = state || '';
};

/**
 * Parse a response
 *      :param info: The response, can be either in a JSON or an urlencoded
 *          format
 *      :param client_info: Information about client and server
 *      :param sformat: Which serialization that was used
 *      :param state: The state
 *      :param kwargs: Extra key word arguments
 *      :return: The parsed and to some extend verified response
 */
Service.prototype.parseResponse = function(info, clientInfo, sformat, state, kwargs){
    if (sformat == 'urlEncoded'){
        info = this.getUrlInfo(info);
    }

    if (this.events){
        this.events.store('Response', info);
    }

    try{
        resp = this.responseCls().deserialize(info, sformat, kwargs);
    }catch(err){
        console.log('Error while deserializing');
    }

    var msg = 'Initial response parsing';
    
    if (this.events){
        this.events.store('Protocol Response', resp);
    }

    if (resp.indexOf('error') !== -1 && !(ErrorResponse instanceof resp)){
        resp = null;
        try{
            errMsgs = [this.errorMsg];
            if (errMsgs.indexOf(ErrorResponse) !== -1){
                errMsgs.push(ErrorResponse);
            }
        }catch(err){
            errMsgs = [ErrorResponse];
        }

        try{
            for (var i = 0; i < errMsgs.length; i++){
                try{
                    resp = errMsg().deserialize(info, sformat);
                    resp.verify();
                    break;
                }catch(err){
                    resp = null;
                }
            }
        }catch(err){
            console.log(err);
        }
    }else{
        kwargs['clientId'] = clientInfo.clientId;
        kwargs['iss'] = clientInfo.issuer;

        if (kwargs.indexOf('key') !== -1 && kwargs.indexOf('keyjar') !== -1){
            kwargs['keyjar'] = this.keyjar;
        }

        try{
            var verf = resp.verify(kwargs);
        }catch(err){
            console.log(err);
        }

        if (!verf){
            console.log('Verification of the response failed');
        }

        if (resp.type() == 'AuthorizationResponse' && resp.indexOf('scope') !== -1){
            try{
                resp['scope'] = kwargs['scope'];
            }catch(err){
                console.log(err);
            }
        }
    }
    if (!resp){
        console.log('Missing or faulty response');
    }

    try{
        this.doPostParseResponse(resp, clientInfo, state);
    }catch(err){
        console.log(err);
    }
    return resp;
};    

/**
 * Parse an error message.
 *      :param reqresp: The response
 *      :param body_type: How the body is encoded
 *      :return: A :py:class:`oicmsg.message.Message` instance
 */
Service.prototype.parseErrorMessage = function(reqresp, bodyType){
    if (bodyType == 'txt'){
        bodyType = 'urlEncoded';
    }else{
        bodyType = bodyType;
    }
    err = this.errorMsg().deserialize(reqresp.text, bodyType);
    try{
        err.verify();
    }catch(err){
        console.log(err);
        return err;
    }
};

/**
 * Deal with a request response
 *      :param reqresp: The HTTP request response
 *      :param client_info: Information about the client/server session
 *      :param response_body_type: If response in body one of 'json', 'jwt' or
 *          'urlencoded'
 *      :param state: Session identifier
 *      :param kwargs: Extra keyword arguments
 *      :return:
 */
Service.prototype.parseErrorMessage = function(reqresp, bodyType){
    if (SUCCESSFUL.indexOf(reqresp.statusCode) !== -1){
        valueType = this.getValueType(reqResp, responseBodyType);
    }
    try{
        return this.parseResponse(reqresp.text, clientInfo, valueType, state, kwargs);
    }catch(err){
        console.log(err);
    }
};
    
/**
 * Get the encoding of the response
 * 
 * :param reqresp: The response
 * :param body_type: Assumed body type
 * :return: The calculated body type
 */
Service.prototype.getValueType = function(reqresp, bodyType){
    if (bodyType){
        return verifyHeader(reqresp, bodyType);
    }else{
        return 'urlencoded';
    }
};    

/**
 * Deal with a request response
 * 
 * :param reqresp: The HTTP request response
 * :param client_info: Information about the client/server session
 * :param response_body_type: If response in body one of 'json', 'jwt' or
 *      'urlencoded'
 * :param state: Session identifier
 * :param kwargs: Extra keyword arguments
 *      :return: 
 */
Service.prototype.parseRequestResponse = function(reqresp, clientInfo, responseBodyType, state, kwargs){
    responseBodyType = responseBodyType || '';
    state = state || '';
    var statusCodeArr = [302, 303];

    if (SUCCESSFUL.indexOf(reqresp.statusCode) !== -1){
        valueType = this.getValueType(reqresp, responseBodyType);

        try{
            return this.parseResponse(reqresp.text, clientInfo, valueType, state, kwargs);
        }catch(err){
            console.log(err);
        }
    }else if (reqresp.statusCodeArr.indexOf(reqresp.statusCode) !== -1){
        return reqresp;
    }else if (reqresp.statusCode === 500){
        console.log('Something went wrong');
    }else if (400 <= reqresp.statusCode < 500){
        valueType = this.getValueType(reqresp, responseBodyType);
        var errResp = null;
        try{
            errResp = this.parseErrorMessage(reqresp, valueType);
        }catch(err){
            return reqresp.text;
        }
        return errResp;
    }else{
        console.log('Error response');
    }
};

/**
 *  The method that sends the request and handles the response returned.
 *  This assumes a synchronous request-response exchange.
 *      :param url: The URL to which the request should be sent
 *      :param response: Response type
 *      :param method: Which HTTP method to use
 *      :param body: A message body if any
 *      :param response_body_type: The expected format of the body of the return message
 *      :param http_args: Arguments for the HTTP client
 *      :return: A cls or ErrorResponse instance or the HTTP response
 *          instance if no response body was expected.
 */
Service.prototype.serviceRequest = function(reqresp, clientInfo, responseBodyType, state, kwargs){
    if (httpArgs == null){
        httpArgs = {};
    }
    try{
        resp = this.httpLib(url, method, data, httpArgs);
        data = data || body;
    }catch(err){
        console.log('Exception on request');
    }
    if (kwargs.indexOf('keyjar') === -1){
        kwargs['keyjar'] = this.keyjar;
    }
    if (!responseBodyType){
        responseBodyType = this.responseBodyType;
    }
    return this.parseRequestResponse(resp, clientInfo, responseBodyType, kwargs);
};    

module.exports = Service;