var OICCli = require('./init.js').OICCli;
var JWT_BEARER = require('./init.js').OICCli.JWT_BEARER;

function Exception(){
}

AuthenticationFailure.prototype = new Exception();
AuthenticationFailure.prototype = Object.create(Exception.prototype);
AuthenticationFailure.prototype.constructor = AuthenticationFailure;

function AuthenticationFailure(){
    Exception.call();
};

NoMatchingKey.prototype = new Exception();
NoMatchingKey.prototype = Object.create(Exception.prototype);
NoMatchingKey.prototype.constructor = NoMatchingKey;

function NoMatchingKey(){
    Exception.call();    
};

UnknownAuthnMethod.prototype = new Exception();
UnknownAuthnMethod.prototype = Object.create(Exception.prototype);
UnknownAuthnMethod.prototype.constructor = NoMatchingKey;

function UnknownAuthnMethod(){
    Exception.call();    
};



function ClientAuthnMethod(){
};
/**
 * """ Add authentication information to a request
        :return:
        """
 */
ClientAuthnMethod.prototype.construct = function(kwargs){
    console.log("Not Implemented")
};


ClientSecretBasic.prototype = new ClientAuthnMethod();
ClientSecretBasic.prototype = Object.create(ClientAuthnMethod.prototype);
ClientSecretBasic.prototype.constructor = ClientSecretBasic;

function ClientSecretBasic(){
};

/**
 * :param cis: Request class instance
 * :param request_args: Request arguments
 * :param http_args: HTTP arguments
 * :return: dictionary of HTTP arguments
 */
ClientSecretBasic.prototype.construct = function(cis, cliInfo, requestArgs, httpArgs, kwargs){
    cliInfo = cliInfo || null;
    requestArgs = requestArgs || null;
    httpArgs = httpArgs || null;
    
    if (httpArgs == null){
        httpArgs = {};
    }

    var passwd = null;

    try{
        passwd = kwargs['password'];
    }catch(err){
        try{
            passwd = httpArgs['password'];
        }catch(err){
            try{
                passwd = cis['clientSecret'];
            }catch(err){
                passwd = cliInfo.clientSecret;
            }
        }
    }

    var user = null;
    try{
        user = kwargs['user'];
    }catch(KeyError){
        user = cliInfo.clientId;
    }

    if (httpArgs.indexOf('headers') === -1){
        httpArgs['headers'] = {};
    }

    var credentials = "{" + user + "}:{" + passwd + "}";

    var authz = base64.urlSafeb64Encode(credentials.encode('utf-8')).decode('utf-8'); //TODO
    httpArgs['header']['Authorization'] = 'Basic {' + authz + '}';

    try{
        delete cis['clientSecret'];
    }catch(err){
        console.log('KeyError');
    }

    if (AccessTokenRequest instanceof cis && cis['grantType'] === 'authorizationCode'){
        if (cis.indexOf('clientId') === -1){
            try{
                cis['clientId'] = cliInfo.clientId;
            }catch(err){
                return;
            }
        }
    }else{
        try{
            req = cis.cParam['clientId'][VREQUIRED];
        }catch(err){
            req = false;
        }

        if (!req){
            try{
                delete cis['clientId'];
            }catch(err){
                return;
            }
        }
    }
    return httpArgs;
};

ClientSecretPost.prototype = new ClientSecretBasic();
ClientSecretPost.prototype = Object.create(ClientSecretBasic.prototype);
ClientSecretPost.prototype.constructor = ClientSecretBasic;

function ClientSecretPost(){
    ClientSecretBasic.call();
};

/**
 * :param cis: Request class instance
 * :param request_args: Request arguments
 * :param http_args: HTTP arguments
 * :return: dictionary of HTTP arguments
 */
ClientSecretBasic.prototype.construct = function(cis, cliInfo, requestArgs, httpArgs, kwargs){
    if (cis.indexOf('clientSecret')){
        try{
            cis['clientSecret'] = httpArgs['clientSecret'];
            delete httpArgs['clientSecret'];
        }catch(err){
            if (cliInfo.clientSecret){
                cis['clientSecret'] = cliInfo.clientSecret;
            }else{
                console.log('Missing client secret');
            }
        }
    }

    cis['clientId'] = cliInfo.clientId;

    return httpArgs;
};



BearerHeader.prototype = new ClientAuthnMethod();
BearerHeader.prototype = Object.create(ClientAuthnMethod.prototype);
BearerHeader.prototype.constructor = BearerHeader;

function BearerHeader(){
    ClientSecretBasic.call();
};

/**
 * More complicated logic then I would have liked it to be
 *      :param cis: Request class instance
 *      :param ci: Client information
 *      :param request_args: request arguments
 *      :param http_args: HTTP header arguments
 *      :param kwargs:
 *      :return:
 */
BearerHeader.prototype.construct = function(cis, cliInfo, requestArgs, httpArgs, kwargs){
    if (cis !== null){
        if (cis.indexOf('accessToken') !== -1){
            accToken = cis['accessToken'];
            delete cis['accessToken'];
            cis.cParam['accessToken'] = SINGLE_OPTIONAL_STRING;
        }else{
            try{
                accToken = requestArgs['accessToken'];
                delete requestArgs['accessToken'];
            }catch(err){
                try{
                    accToken = kwargs['accessToken'];
                }catch(err){
                    accToken = cliInfo.stateDb.getTokenInfo(kwargs)['accessToken'];
                }
            }
        }
    }else{
        try{
            accToken = kwargs['accessToken'];
        }catch(err){
            accToken = requestArgs['accessToken'];
        }
    }

    bearer = "Bearer " + accToken;

    if (httpArgs == null){
        httpArgs = {'header' : {}};
        httpArgs['header']['Authorization'] = bearer;
    }else{
        try{
            httpArgs['headers']['Authorization'] = bearer;
        }catch(err){
            httpArgs['headers'] = {'Authorization': bearer};
        }
    }
    return httpArgs;
};

BearerBody.prototype = new ClientAuthnMethod();
BearerBody.prototype = Object.create(ClientAuthnMethod.prototype);
BearerBody.prototype.constructor = BearerBody;

function BearerBody(){
    ClientAuthMethod.call();
};

/**
 * More complicated logic then I would have liked it to be
 *      :param cis: Request class instance
 *      :param ci: Client information
 *      :param request_args: request arguments
 *      :param http_args: HTTP header arguments
 *      :param kwargs:
 *      :return:
 */
BearerBody.prototype.construct = function(cis, cliInfo, requestArgs, httpArgs, kwargs){
    if (requestArgs === null){
        requestArgs = {};
    }

    if (cis.indexOf('accessToken') !== -1){
        return;
    }else{
        try{
            cis['accessToken'] = requestArgs['accessToken'];
        }catch(err){
            if (!cliInfo.state){
                console.log('Missing state specification');
            }
            kwargs['state'] = cliInfo.state;
        }
        cis['accessToken'] = cliInfo.stateDb.getTokenInfo(kwargs)['accessToken'];
    }
    return httpArgs;
}

function bearerAuth(req, authn){
    try{
        return req['accessToken'];
    }catch(err){
        assert.isTrue(authn.startsWith('Bearer '));
        return authn.substring(7, authn.length-1);
    }
}
   
JWSAuthnMethod.prototype = new ClientAuthnMethod();
JWSAuthnMethod.prototype = Object.create(ClientAuthnMethod.prototype);
JWSAuthnMethod.prototype.constructor = JWSAuthnMethod;

function JWSAuthnMethod(){
    ClientAuthnMethod.call();
};

/**
 * More complicated logic then I would have liked it to be
 *      :param cis: Request class instance
 *      :param ci: Client information
 *      :param request_args: request arguments
 *      :param http_args: HTTP header arguments
 *      :param kwargs:
 *      :return:
 */
JWSAuthnMethod.prototype.chooseAlgorithm = function(entity, kwargs){
    try{
        algorithm = kwargs['algorithm'];
    }catch(err){
        algorithm = DEF_SIGN_ALG[entity];
    }

    if (!algorithm){
        console.log('Missing algorithm specification')
    }
    return algorithm;
};

JWSAuthnMethod.prototype.getSigningKey = function(algorithm, cliInfo){
    alg = alg || algorithm;
    return cliInfo.keyjar.getSigningKey(alg2keyType(algorithm), alg)
};

JWSAuthnMethod.prototype.getKeyByKid = function(kid, algorithm, cliInfo){
    var key = cliInfo.keyjar.getKeyByKid(kid);
    if (key){
        ktype = alg2keyType(algorithm);
        try{
            assert.deepEqual(key.kty, ktype);
        }catch(err){
            console.log('Wrong key type');
        }
        return key;
    }else{
        console.log('No key with kid')
    }
};

/**
 * Constructs a client assertion and signs it with a key.
 *      The request is modified as a side effect.
 *      :param cis: The request
 *      :param request_args: request arguments
 *      :param http_args: HTTP arguments
 *      :param kwargs: Extra arguments
 *      :return: Constructed HTTP arguments, in this case none
 */
JWSAuthnMethod.prototype.construct = function(cis, cliInfo, requestArgs, httpArgs, kwargs){
    if (kwargs.indexOf('clientAssertion') !== -1){
        cis['clientAssertionType'] = kwargs['clientAssertion'];
        if (kwargs.indexOf('clientAssertionType') !== -1){
            cis['clientAssertionType'] = kwargs['clientAssertionType'];
        }else{
            cis['clientAssertionType'] = JWTBEARER;
        }
    }else if(cis.indexOf('clientAssertion') !== -1){
        if (cis.indexOf('clientAssertionType') !== -1){
            cis['clientAssertionType'] = JWT_BEARER;
        }
    }else{
        algorithm = null;
        var tokenInfo = ['token', 'refresh'];
        if (tokenInfo.indexOf(kwargs['authEndpoint'])){
            try{
                algorithm = cliInfo.registrationInfo['tokenEndpointAuthSigningAlg'];
            }catch(err){
                return
            }
            audience = cliInfo.providerInfo['tokenEndpoint'];
        }else{
            audience = cliInfo.providerInfo['issuer'];
        }

        if (!algorithm){
            algorithm = this.chooseAlgorithm(kwargs);
        }

        ktype = alg2keyType(algorithm);
        try{
            if (kwargs.indexOf('kid')){
                signingKey = [this.getKeyByKid(kwargs['kid'], algorithm, cliInfo)];
            }else if (cliInfo.kid['sig'].indexOf(ktype)){
                try{
                    signingKey = this.getKeyByKid(cliInfo.kid['sig'][ktype], algorithm, cliInfo);
                }catch(err){
                    signingKey = this.getSigningKey(algorithm, cliInfo);
                }
            }else{
                signingKey = this.getSigningKey(algorithm, cliInfo);
            }
        }catch(err){
            console.log('No Matching Key');
        }

        try{
            args = {'lifetime' : kwargs['lifetime']};
        }catch(err){
            args = {};
        }

        cis['clientAssertion'] = assertionJwt(cliInfo.clientId, signingKey, audience, algorithm, args);
        cis['clientAssertionType'] = JWTBEARER;
    }

    try{
        delete cis['clientSecret'];
    }catch(err){
        console.log('KeyError')
    }

    if (!cis.cParam['clientId'][VREQUIRED]){
        try{
            delete cis['clientId'];
        }catch(err){
            console.log('KeyError');
        }
    }

    return {};
};

ClientSecretJWT.prototype = new JWSAuthnMethod();
ClientSecretJWT.prototype = Object.create(JWSAuthnMethod.prototype);
ClientSecretJWT.prototype.constructor = ClientSecretJWT;

function ClientSecretJWT(){
    JWSAuthnMethod.call();
};

/**
 * More complicated logic then I would have liked it to be
 *      :param cis: Request class instance
 *      :param ci: Client information
 *      :param request_args: request arguments
 *      :param http_args: HTTP header arguments
 *      :param kwargs:
 *      :return:
 */
ClientSecretJWT.prototype.chooseAlgorithm = function(entity, kwargs){
    entity = entity || 'clientSecretJwt';
    return JWSAuthnMethod.chooseAlgorithm(entity, kwargs);
};

ClientSecretJWT.prototype.getSigningKey = function(algorithm, cliInfo){
    alg = alg || algorithm;
    return cliInfo.keyjar.getSigningKey(alg2keyType(algorithm), "", alg)
};


PrivateKeyJWT.prototype = new JWSAuthnMethod();
PrivateKeyJWT.prototype = Object.create(JWSAuthnMethod.prototype);
PrivateKeyJWT.prototype.constructor = PrivateKeyJWT;

function PrivateKeyJWT(){
    JWSAuthnMethod.call();
};

/**
 * More complicated logic then I would have liked it to be
 *      :param cis: Request class instance
 *      :param ci: Client information
 *      :param request_args: request arguments
 *      :param http_args: HTTP header arguments
 *      :param kwargs:
 *      :return:
 */
PrivateKeyJWT.prototype.chooseAlgorithm = function(entity, kwargs){
    entity = entity || 'privateKeyJwt';
    return JWSAuthnMethod.chooseAlgorithm(entity, kwargs);
};

PrivateKeyJWT.prototype.getSigningKey = function(algorithm, cliInfo){
    cliInfo = cliInfo || null;
    alg = alg || algorithm;
    return cliInfo.keyjar.getSigningKey(alg2keyType(algorithm), '', alg);
};

var CLIENT_AUTHN_METHOD = {
    "client_secret_basic": ClientSecretBasic,
    "client_secret_post": ClientSecretPost,
    "bearer_header": BearerHeader,
    "bearer_body": BearerBody,
    "client_secret_jwt": ClientSecretJWT,
    "private_key_jwt": PrivateKeyJWT,
};

var TYPE_METHOD = [(JWT_BEARER, JWSAuthnMethod)];

function validClientInfo(cInfo, when){
    var eta = cinfo.get('clientSecretExpiresAt', 0);
    var now = when || utcTimeSansFrac();
    if (eta !== 0 && eta < now){
        return false;
    }
    return true;
}

module.exports.AuthenticationFailure = AuthenticationFailure;
module.exports.NoMatchingKey = NoMatchingKey;
module.exports.UnknownAuthnMethod = UnknownAuthnMethod;
module.exports.ClientAuthnMethod = ClientAuthnMethod;
module.exports.ClientSecretBasic = ClientSecretBasic;
module.exports.ClientSecretPost = ClientSecretPost;
module.exports.BearerHeader = BearerHeader;
module.exports.BearerBody = BearerBody;
module.exports.JWSAuthnMethod = JWSAuthnMethod;
module.exports.ClientSecretJWT = ClientSecretJWT;
module.exports.PrivateKeyJWT = PrivateKeyJWT;