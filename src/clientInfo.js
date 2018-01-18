var State = require('./state.js').State;
var crypto = require('crypto');
var KeyJar = require('../oicMsg/src/models/keystore-dependency/KeyJar');
var assert = require('chai').assert;

var ATTRMAP = {
    "userinfo": {
        "sign": "userinfo_signed_response_alg",
        "alg": "userinfo_encrypted_response_alg",
        "enc": "userinfo_encrypted_response_enc"},
    "id_token": {
        "sign": "id_token_signed_response_alg",
        "alg": "id_token_encrypted_response_alg",
        "enc": "id_token_encrypted_response_enc"},
    "request": {
        "sign": "request_object_signing_alg",
        "alg": "request_object_encryption_alg",
        "enc": "request_object_encryption_enc"}
}

var DEFAULT_SIGN_ALG = {
    "userinfo": 'RS256',
    "request": 'RS384',
    "id_token": 'ES384',
};

function ClientInfo(){
    return this;
};

ClientInfo.prototype.init = function(keyjar, config, events,
    db, dbName, strictOnPreferences, kwargs){
    keyjar = keyjar || null;

    this.keyjar = keyjar || new KeyJar();
    this.stateDb = new State();
    this.stateDb.init('', db, dbName);
    this.config = config || null;
    this.events = events || null;
    this.db = db || null;
    this.dbName = dbName || '';
    this.strictOnPreferences = strictOnPreferences || false;
    this.providerInfo = {};
    this.registrationResponse = {};
    this.kid = {"sig": {}, "enc": {}};

    this.config = config || {};
    this.baseUrl = '';
    this.requestDir = '';
    this.allow = {};
    this.behavior = {};
    this.clientPrefs = {};
    this.cId = '';
    this.cSecret = '';
    this.issuer = '';

    var items = [];
    if (kwargs){
        items = kwargs.items();
    }
    for (var i = 0; i < items.length; i++){
        var pair = kwargs.items()[i];
        var key = pair[0];
        var val = pair[1];
        this.key = val;
    }

    var clientInfo = ['client_id', 'issuer', 'client_secret', 'base_url', 'requests_dir'];
    var defaultVal = '';
    for (var i = 0; i < clientInfo.length; i++){
        var attr = clientInfo[i];
        if (attr === 'client_id'){
            this.clientId = this.config[attr] || defaultVal;
            this.stateDb.clientId = this.config[attr];
        }else if(attr === 'issuer'){
            this.issuer = this.config[attr] || defaultVal;
        }else if (attr === 'client_secret'){
            this.clientSecret = this.config[attr] || defaultVal;
        }else if (attr === 'base_url'){
            this.baseUrl = this.config[attr] || defaultVal;
        }else if (attr === 'requests_dir'){
            this.requestDir = this.config[attr] || defaultVal;
        }
    };

    var providerInfo = ['allow', 'client_prefs', 'behaviour', 'provider_info'];
    var defaultVal = {};
    for (var i = 0; i < providerInfo.length; i++){
        var attr = providerInfo[i];
        if (attr === 'allow'){
            this.allow = this.config[attr] || defaultVal;
        }else if (attr === 'client_prefs'){
            this.clientPrefs = this.config[attr] || defaultVal;
        }else if (attr === 'behaviour'){
            this.behavior = this.config[attr] || defaultVal;
        }else if (attr === 'provider_info'){
            this.providerInfo = this.config[attr] || defaultVal;
        }
    };

    if (this.requestDir){
        /*if (fs.lstatSync(this.requestDir).isDir()) {
            try{
                shell.mkdir('-p', filePath);    
              }catch(err){
                console.log("OSError")
              }
        }*/
    }

    try{
        this.redirectUris = this.config['redirectUris'];
    }catch(err){
        this.redirectUris = [null];
    }

    try{
        //this.importKeys(config['keys']);
    }catch(err){
        console.log(err);
    }
    if (config && Object.keys(config).indexOf('keydefs') !== -1){
        this.keyjar = this.buildKeyJar(config['keydefs'], this.keyjar)[1];
    }
};

ClientInfo.prototype.getClientSecret = function() {
    return this.cSecret;
};

ClientInfo.prototype.setClientSecret = function(val) {
    if (!val){
        this.cSecret;
    }else{
        this.cSecret = val;
        // client uses it for signing
        // Server might also use it for signing which means the
        // client uses it for verifying server signatures
        if (this.keyjar == null){
            this.keyjar = new KeyJar();
        }
        this.keyjar.addSymmetric('', val.toString());
    }
};

var clientSecret = [this.getClientSecret,this.setClientSecret];

ClientInfo.prototype.filenameFromWebName = function(webName) {
   assert.isTrue(webName.startsWith(this.baseUrl));
   var name = webName[this.baseUrl.length];
   if (name.startsWith('/')){
       return name.substring(1, name.length);
   }else{
       return name;
   }
};

/**
 * :param typ: 'id_token', 'userinfo' or 'request_object'
 * :return:
 */
ClientInfo.prototype.signEncAlgs = function(typ) {
    var resp = {};
    for (var i = 0; i < Object.keys(ATTRMAP[typ]).length; i++){
        var key = Object.keys(ATTRMAP[typ])[i];
        var val = ATTRMAP[typ][key];
        if (key === 'sign'){
            try{
                resp[key] = DEFAULT_SIGN_ALG[typ];
            }catch(err){
                return;
            }
        }else if (this.registrationResponse[val]){
            resp[key] = this.registrationResponse[val];            
        }
    }
    return resp;
 };

 /**
  * Verifies that the algorithm to be used are supported by the other side
  *     :param alg: The algorithm specification
  *     :param usage: In which context the 'alg' will be used.
  *     
  *     The following values are supported:
  *         - userinfo
  *         - id_token
  *         - request_object
  *         - token_endpoint_auth
  *     :param typ:
  *         - signing_alg
  *         - encryption_alg
  *         - encryption_enc
  *     :return: True or False
  */
 ClientInfo.prototype.verifyAlgSupport = function(alg, usage, typ) {
    var supported = this.providerInfo[usage + "_" + typ + "_values_supported"];
    if (supported.indexOf(alg) !== -1){
        return true;
    }else{
        return false;
    }
 };
    
 /**
  *  Need to generate a path that is unique for the OP/RP combo
  *     :return: A list of one unique URL
  */
 ClientInfo.prototype.generateRequestUris = function(requestDir) {
    var m = crypto.createHmac('sha256', '')
    try{
        m.update(this.providerInfo['issuer']); 
    }catch(error){
        m.update(this.issuer);
    }
    m.update(this.baseUrl);
    return [this.baseUrl + requestDir + "/" + m.digest('hex')];
 };

 ClientInfo.prototype.filenameFromWebName = function(webName) {
   assert.isTrue(webName.startsWith(this.baseUrl));
   var name = webName.substring(this.baseUrl.length, webName.length);
   if (name.startsWith('/')){
       return name.substring(1, name.length);
   }else{
       return name;
   }
 };

 /**
  * TODO
  *
  * PKCE RFC 7636 support
  * :return:
  */
  /*
 ClientInfo.prototype.addCodeChallenge = function(requestDir) {
     var cvLen = null;
     try{
         cvLen = clientInfo.config['codeChallenge']['length'];
     }catch(err){
        cvLen = 64;        
     }

     var codeVerifier = unreserved(cvLen);
     var cv = codeVerifier.encode();

     var method = null;
     try{
         method = clientInfo.config['codeChallenge']['method'];
     }catch(err){
         method = '5256';
     }

     var h = null;
     try{
        h = CC_METHOD[method](_cv).hexdigest();
        codeChallenge = b64e(h.encode()).decode();
     }catch(err){
         console.log('PKCE Transformation method');
     }

     return {"code_challenge": code_challenge,
     "code_challenge_method": _method}, code_verifier;
 }*/
    
module.exports = ClientInfo;