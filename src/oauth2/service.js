var Service = require('../service');

function postXParseResponse(resp, cliInfo, state){
    state = state || '';
    if (resp instanceof (AuthorizationResponse, AccessTokenResponse)){
        cliInfo.stateDb.addMessageInfo(resp, state);
    }
};

function getState(requestArgs, kwargs){
    try{
        state = kwargs['state'];
    }catch(err){
        try{
            state = requestArgs['state'];
        }catch(err){
            console.log(err);
            //MissingParameter('state');
        }
    }
    return state;
};

Authorization.prototype = new Service();
Authorization.prototype = Object.create(Service.prototype);
Authorization.prototype.constructor = Authorization;

function Authorization(){
  this.msgType = oauth2.AuthorizationRequest;
  this.responseCls = oauth2.AuthorizationResponse;
  this.errorMsg = oauth2.AuthorizationErrorResponse;
  this.endpointName = 'authorizationEndpoint';
  this.synchronous = false;
  this.request = 'authorization';
};
  
Authorization.prototype.init = function(httpLib, keyJar, clientAuthnMethod){
    httpLib = httpLib || null;
    keyJar = keyJar || null;
    clientAuthnMethod = clientAuthnMethod || null;
    Service.call(httpLib, keyJar, clientAuthnMethod);
    this.preConstruct.append(this.oauthPreConstruct);
    this.postParseResponse.append(postXParseResponse);
};

Authorization.prototype.parseArgs = function(cliInfo, kwargs){
    arArgs = Service.parseArgs(cliInfo, kwargs);
    if (arArgs.indexOf('redirectUri') === -1){
        try{
            arArgs['redirectUri'] = cliInfo.redirectUris[0];
        }catch(err){
            console.log(err);
            console.log('Missing parameter redirect uri')
        }
    }
    return arArgs;
};    

Authorization.prototype.doRequestInit = function(cliinfo, bodyType, method, authnMethod, requestArgs, httpArgs, kwargs){
    bodyType = bodyType || "";
    method = method || "GET";
    authnMethod = authnMethod || '';
    requestArgs = requestArgs || null;
    httpArgs = httpArgs || null;
    
    try{
        algs = kwargs['algs'];
    }catch(err){
        algs = {};
    }
    delete kwargs['algs'];

    var info = Service.doRequestInit(cliInfo, bodyType, method, authnMethod, requestArgs, httpArgs, kwargs);

    info['algs'] = algs;
    return info;
};    

Authorization.prototype.oauthPreConstruct = function(cliinfo, requestArgs, kwargs){
    var latest = null;
    if (requestArgs != null){
        try{
            latest = requestArgs['redirectUri'];
            if (latest){
                this.redirectUris = [latest];
            }
        }catch(err){
            console.log(err);
        }
    }else{
        requestArgs = {};
    }

    requestaRGS['state'] = this.getState(requestArgs, kwargs);
    return requestArgs, {};
};    

AccessToken.prototype = new Service();
AccessToken.prototype = Object.create(Service.prototype);
AccessToken.prototype.constructor = AccessToken;

function AccessToken(){
    this.msgType = oauth2.AuthorizationRequest;
    this.responseCls = oauth2.AuthorizationResponse;
    this.errorMsg = oauth2.AuthorizationErrorResponse;
    this.endpointName = 'authorizationEndpoint';
    this.synchronous = false;
    this.request = 'authorization';
    this.defaultAuthnMethod = 'clientSecretBasic';
    this.httpMethod = 'POST';
  };
    
  AccessToken.prototype.init = function(httpLib, keyJar, clientAuthnMethod){
      httpLib = httpLib || null;
      keyJar = keyJar || null;
      clientAuthnMethod = clientAuthnMethod || null;
      Service.call(httpLib, keyJar, clientAuthnMethod);
      this.preConstruct.append(this.oauthPreConstruct);
      this.postParseResponse.append(postXParseResponse);
  };

  AccessToken.prototype.oauthPreConstruct = function(cliInfo, requestArgs, kwargs){
    var state = this.getState(requestArgs, kwargs);
    var reqArgs = cliInfo.stateDb.getRequestArgs(state, this.msgType);

    if (requestArgs == null){
        requestArgs = reqArgs;
    }else{
        requestArgs.update(reqArgs);
    }

    if (requestArgs.indexOf('grantType')){
        requestArgs['grantType'] = 'authorizationCode';
    }

    return requestArgs, {};
  };


  RefreshAccessToken.prototype = new Service();
  RefreshAccessToken.prototype = Object.create(Service.prototype);
  RefreshAccessToken.prototype.constructor = RefreshAccessToken;
  
  function RefreshAccessToken(){
      this.msgType = oauth2.AuthorizationRequest;
      this.responseCls = oauth2.AuthorizationResponse;
      this.errorMsg = oauth2.AuthorizationErrorResponse;
      this.endpointName = 'authorizationEndpoint';
      this.synchronous = false;
      this.request = 'authorization';
      this.defaultAuthnMethod = 'clientSecretBasic';
      this.httpMethod = 'POST';
    };
      
    RefreshAccessToken.prototype.init = function(httpLib, keyJar, clientAuthnMethod){
        httpLib = httpLib || null;
        keyJar = keyJar || null;
        clientAuthnMethod = clientAuthnMethod || null;
        Service.call(httpLib, keyJar, clientAuthnMethod);
        this.preConstruct.append(this.oauthPreConstruct);
    };

    RefreshAccessToken.prototype.init = function(httpLib, keyJar, clientAuthnMethod){
        httpLib = httpLib || null;
        keyJar = keyJar || null;
        clientAuthnMethod = clientAuthnMethod || null;
        Service.call(httpLib, keyJar, clientAuthnMethod);
        this.preConstruct.append(this.oauthPreConstruct);
    };

    RefreshAccessToken.prototype.oauthPreConstruct = function(cliInfo, requestArgs, kwargs){
        var state = this.getState(requestArgs, kwargs);
        var reqArgs = cliInfo.stateDb.getRequestArgs(state, this.msgType);
    
        if (requestArgs == null){
            requestArgs = reqArgs;
        }else{
            requestArgs.update(reqArgs);
        }
    
        return requestArgs, {};
    };

    ProviderInfoDiscovery.prototype = new Service();
    ProviderInfoDiscovery.prototype = Object.create(Service.prototype);
    ProviderInfoDiscovery.prototype.constructor = ProviderInfoDiscovery;
    
    function ProviderInfoDiscovery(){
        this.msgType = oauth2.Message;
        this.responseCls = oauth2.ASConfigurationResponse;
        this.errorMsg = oauth2.ErrorResponse;
        this.synchronous = true;
        this.request = 'providerInfo';
        this.httpMethod = 'GET';
    };
        
    ProviderInfoDiscovery.prototype.init = function(httpLib, keyJar, clientAuthnMethod){
        Service.init(httpLib, keyJar, clientAuthnMethod);
        this.postParseResponse.append(this.oauthPostParseResponse);
    };

    ProviderInfoDiscovery.prototype.requestInfo = function(cliInfo, method, requestArgs, lax, kwargs){
        method = method || 'GET';
        requestArgs = requestArgs || null;
        lax = lax || false;

        this.issuer = cliInfo.issuer;
        var issuerUpdated = null;
        if (issuer.endsWith('/')){
            var splitIssuer = issuer.split('');
            var reversedIssuer = splitIssuer.reverse();
            var joinedIssuer = reversedIssuer.join('');
            issuerUpdated = joinedIssuer;
        }else{
            issuerUpdated = issuer;
        }
        return {'uri': OIDCONF_PATTERN % issuer};
    };

    /**
     * Deal with Provider Config Response
     * :param resp: The provider info response
     * :param cli_info: Information about the client/server session
     */
    ProviderInfoDiscovery.prototype.oauthPostParseResponse = function(resp, cliInfo, kwargs){
        var issuer = cliInfo.issuer;
        var pcrIssuer = null;
        if (resp.indexOf(issuer) !== -1){
            var pcrIssuer = resp['issuer'];
            var issuerUpdated = null;
            if (resp['issuer'].endsWith('/')){
                if (issuer.endsWith('/')){
                    issuerUpdated = issuer;
                }else{
                    issuerUpdated = issuer + '/';
                }
            }else{
                if (issuer.endsWith('/')){
                    var splitIssuer = issuer.split('');
                    var reversedIssuer = splitIssuer.reverse();
                    var joinedIssuer = reversedIssuer.join('');
                    issuerUpdated = joinedIssuer;
                }else{
                    issuerUpdated = issuer;
                }
            }

            try{
                cliinfo.allow['issuerMismatch'];
            }catch(err){
                try{
                    assert.deepEquals(issuer, pcrIssuer);
                }catch(err){
                    console.log('Provider info issuer mismatch');
                }
            }
        }else{
            pcrIssuer = issuer;
        }

        cliInfo.issuer = pcrIssuer;
        cliInfo.providerInfo = resp;

        for (var i = 0; i < resp.items(); i++){
            var pair = resp.items()[i];
            var key = pair[0];
            var val = pair[1];
            if (key.endsWith('endpoint')){
                for (var i = 0; i < cliInfo.service.values().length; i++){
                    if (srv.endpointName == key){
                        srv.endpoint = val;
                    }
                }
            }
        }

        try{
            kj = cliInfo.keyJar;
        }catch(err){
            kj = KeyJar();
        }

        kj.loadKeys(resp, pcrIssuer);
        cliInfo.keyJar = kj;
    
    };
       
function Factory(reqName, kwargs){
    for (var i = 0; i < inspect.getMembers(sys.modules[_name_]); i++){
        if (inspect.isClass(obj) && isSubClass(obj, Service)){
            try{
                if (obj.name === reqName){
                    return obj(kwargs);
                }  
            }catch(err){
                console.log(err);
            }
        }
    }
};

module.exports.Authorization = Authorization;
module.exports.AccessToken = AccessToken;
module.exports.RefreshAccessToken = RefreshAccessToken;
module.exports.ProviderInfoDiscovery = ProviderInfoDiscovery;
module.exports.Factory = Factory;