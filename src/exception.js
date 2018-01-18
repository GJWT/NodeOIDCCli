function Exception(){
};

OicCliError.prototype = new Exception();
OicCliError.prototype = Object.create(Exception.prototype);
OicCliError.prototype.constructor = OicCliError;

function OicCliError(){
};

OicCliError.prototype.init = function(errMsg, contentType, args){
    Exception.init(errMsg, args);
    this.contentType = contentType;
};    

HttpError.prototype = new OicCliError();
HttpError.prototype = Object.create(OicCliError.prototype);
HttpError.prototype.constructor = HttpError;

function HttpError(){
    throw new Error("Unsupported Operation Exception");         
};

MissingRequiredAttribute.prototype = new OicCliError();
MissingRequiredAttribute.prototype = Object.create(OicCliError.prototype);
MissingRequiredAttribute.prototype.constructor = MissingRequiredAttribute;

function MissingRequiredAttribute(){
    throw new Error("Unsupported Operation Exception");             
};

VerificationError.prototype = new OicCliError();
VerificationError.prototype = Object.create(OicCliError.prototype);
VerificationError.prototype.constructor = VerificationError;

function VerificationError(OicCliError){
    throw new Error("Unsupported Operation Exception");         
};

ResponseError.prototype = new OicCliError();
ResponseError.prototype = Object.create(OicCliError.prototype);
ResponseError.prototype.constructor = ResponseError;

function ResponseError(){
    throw new Error("Unsupported Operation Exception");         
};

TimeFormatError.prototype = new OicCliError();
TimeFormatError.prototype = Object.create(OicCliError.prototype);
TimeFormatError.prototype.constructor = TimeFormatError;

function TimeFormatError(){
    throw new Error("Unsupported Operation Exception");         
};

CapabilitiesMisMatch.prototype = new OicCliError();
CapabilitiesMisMatch.prototype = Object.create(OicCliError.prototype);
CapabilitiesMisMatch.prototype.constructor = CapabilitiesMisMatch;

function CapabilitiesMisMatch(){
    throw new Error("Unsupported Operation Exception");         
};


MissingEndpoint.prototype = new OicCliError();
MissingEndpoint.prototype = Object.create(OicCliError.prototype);
MissingEndpoint.prototype.constructor = MissingEndpoint;

function MissingEndpoint(){
    throw new Error("Unsupported Operation Exception");         
};

TokenError.prototype = new OicCliError();
TokenError.prototype = Object.create(OicCliError.prototype);
TokenError.prototype.constructor = TokenError;

function TokenError(){
    throw new Error("Unsupported Operation Exception");         
};

GrantError.prototype = new OicCliError();
GrantError.prototype = Object.create(OicCliError.prototype);
GrantError.prototype.constructor = GrantError;

function GrantError(){
    throw new Error("Unsupported Operation Exception");         
};

ParseError.prototype = new OicCliError();
ParseError.prototype = Object.create(OicCliError.prototype);
ParseError.prototype.constructor = ParseError;

function ParseError(){
    throw new Error("Unsupported Operation Exception");         
};

OtherError.prototype = new OicCliError();
OtherError.prototype = Object.create(OicCliError.prototype);
OtherError.prototype.constructor = OtherError;

function OtherError(){
    throw new Error("Unsupported Operation Exception");         
};


NoClientInfoReceivedError.prototype = new OicCliError();
NoClientInfoReceivedError.prototype = Object.create(OicCliError.prototype);
NoClientInfoReceivedError.prototype.constructor = NoClientInfoReceivedError;

function NoClientInfoReceivedError(){
    throw new Error("Unsupported Operation Exception");         
};

InvalidRequest.prototype = new OicCliError();
InvalidRequest.prototype = Object.create(OicCliError.prototype);
InvalidRequest.prototype.constructor = InvalidRequest;

function InvalidRequest(){
    throw new Error("Unsupported Operation Exception");         
};

NonFatalException.prototype = new OicCliError();
NonFatalException.prototype = Object.create(OicCliError.prototype);
NonFatalException.prototype.constructor = NonFatalException;

/**
 * :param resp: A response that the function/method would return on non-error
 * :param msg: A message describing what error has occurred.
 */
function NonFatalException(){
    throw new Error("Unsupported Operation Exception");         
};

NonFatalException.prototype.init = function(resp, msg){
    this.resp = resp
    this.msg = msg
}; 


Unsupported.prototype = new OicCliError();
Unsupported.prototype = Object.create(OicCliError.prototype);
Unsupported.prototype.constructor = Unsupported;

function Unsupported(){
    console.log("Unsupported Operation Exception");         
};

UnsupportedResponseType.prototype = new Unsupported();
UnsupportedResponseType.prototype = Object.create(Unsupported.prototype);
UnsupportedResponseType.prototype.constructor = UnsupportedResponseType;

function UnsupportedResponseType(){
    console.log("Unsupported Operation Exception");        
};

AccessDenied.prototype = new OicCliError();
AccessDenied.prototype = Object.create(OicCliError.prototype);
AccessDenied.prototype.constructor = AccessDenied;

function AccessDenied(){
    console.log("Unsupported Operation Exception");         
};

function NonFatalException(){
    console.log("Unsupported Operation Exception");         
};

ImproperlyConfigured.prototype = new OicCliError();
ImproperlyConfigured.prototype = Object.create(OicCliError.prototype);
ImproperlyConfigured.prototype.constructor = ImproperlyConfigured;

function ImproperlyConfigured(){
    console.log("Unsupported Operation Exception");         
};

UnsupportedMethod.prototype = new OicCliError();
UnsupportedMethod.prototype = Object.create(OicCliError.prototype);
UnsupportedMethod.prototype.constructor = UnsupportedMethod;

function UnsupportedMethod(){
    console.log("Unsupported Operation Exception");         
};

AuthzError.prototype = new OicCliError();
AuthzError.prototype = Object.create(OicCliError.prototype);
AuthzError.prototype.constructor = AuthzError;

function AuthzError(){
    throw new Error("Unsupported Operation Exception");         
};

AuthnToOld.prototype = new OicCliError();
AuthnToOld.prototype = Object.create(OicCliError.prototype);
AuthnToOld.prototype.constructor = UnsupportedMethod;

function AuthnToOld(){
    throw new Error("Unsupported Operation Exception");         
};

AuthnToOld.prototype = new OicCliError();
AuthnToOld.prototype = Object.create(OicCliError.prototype);
AuthnToOld.prototype.constructor = UnsupportedMethod;

function UnsupportedMethod(){
    throw new Error("Unsupported Operation Exception");         
};

ParameterError.prototype = new OicCliError();
ParameterError.prototype = Object.create(OicCliError.prototype);
ParameterError.prototype.constructor = ParameterError;

function ParameterError(){
    throw new Error("Unsupported Operation Exception");         
};

SubMismatch.prototype = new OicCliError();
SubMismatch.prototype = Object.create(OicCliError.prototype);
SubMismatch.prototype.constructor = SubMismatch;

function SubMismatch(){
    throw new Error("Unsupported Operation Exception");         
};

ConfigurationError.prototype = new OicCliError();
ConfigurationError.prototype = Object.create(OicCliError.prototype);
ConfigurationError.prototype.constructor = ParameterError;

function ConfigurationError(){
    throw new Error("Unsupported Operation Exception");         
};

WrongContentType.prototype = new OicCliError();
WrongContentType.prototype = Object.create(OicCliError.prototype);
WrongContentType.prototype.constructor = WrongContentType;

function WrongContentType(){
    throw new Error("Unsupported Operation Exception");         
};

module.exports.WrongContentType = WrongContentType;
module.exports.ConfigurationError = ConfigurationError;
module.exports.SubMismatch = SubMismatch;
module.exports.ParameterError = ParameterError;
module.exports.AuthnToOld = AuthnToOld;
module.exports.AuthzError = AuthzError;
module.exports.UnsupportedMethod = UnsupportedMethod;
module.exports.ImproperlyConfigured = ImproperlyConfigured;
module.exports.AccessDenied = AccessDenied;
module.exports.UnsupportedResponseType = UnsupportedResponseType;
module.exports.Unsupported = Unsupported;
module.exports.AuthnToOld = AuthnToOld;
module.exports.AuthzError = AuthzError;
module.exports.UnsupportedMethod = UnsupportedMethod;
module.exports.NonFatalException = NonFatalException;
module.exports.InvalidRequest = InvalidRequest;
module.exports.NoClientInfoReceivedError = NoClientInfoReceivedError;
module.exports.OtherError = OtherError;
module.exports.ParseError = ParseError;
module.exports.GrantError = GrantError;
module.exports.TokenError = TokenError;
module.exports.MissingEndpoint = MissingEndpoint;
module.exports.CapabilitiesMisMatch = CapabilitiesMisMatch;
module.exports.TimeFormatError = TimeFormatError;
module.exports.ResponseError = ResponseError;
module.exports.VerificationError = VerificationError;
module.exports.MissingRequiredAttribute = MissingRequiredAttribute;
module.exports.HttpError = HttpError;
module.exports.OicCliError = OicCliError;






