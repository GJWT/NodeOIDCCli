var crypto = require('crypto');
crypto.createHmac('sha256', '')

function OICCli(){
}

OICCli.prototype.OIDCONF_PATTERN = "%s/.well-known/openid-configuration";

OICCli.prototype.CC_METHOD = {
    'S256': crypto.createHmac('sha256', ''),
    'S384': crypto.createHmac('sha256', ''),
    'S512': crypto.createHmac('sha256', ''),
}

OICCli.prototype.DEF_SIGN_ALG = {"id_token": "RS256",
                "userinfo": "RS256",
                "request_object": "RS256",
                "client_secret_jwt": "HS256",
                "private_key_jwt": "RS256"}

OICCli.prototype.HTTP_ARGS = ["headers", "redirections", "connection_type"]

OICCli.prototype.JWT_BEARER = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
OICCli.prototype.SAML2_BEARER_GRANT_TYPE = "urn:ietf:params:oauth:grant-type:saml2-bearer"

/**
 * Returns a string of random ascii characters or digits
 * :param size: The length of the string
 * :return: string
*/
OICCli.prototype.rndStr = function(size){
    return Math.random().toString(36).substring(size);    
};

/**
 * Returns a string of random ascii characters, digits and unreserved
 * characters
 * :param size: The length of the string
 * :return: string
 */
OICCli.prototype.unreserved = function(){
};

OICCli.prototype.sanitize = function(str){
    return str;
}

module.exports.OICCli = OICCli;
