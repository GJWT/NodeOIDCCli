Node OIDC Service messages
==========================================

## Background

This is the package that implements the request-response pattern in the OAuth2/OpenID Connect protocols and 
is meant to be transport independent. It’s the middle layer between low level OIDCMsg which deals with simple 
messages and their serialization and deserialization and the upper layer OIDCRP which provides the API that 
most service implementers should use. 

### Objective :
OIDCClient is built to allow clients to be constructed that supports any number and type of request-response services.

## Global Classes

### Service Class
```
Service(serviceContext, stateDb, clientAuthnMethod, conf)
```

Implements all the functionality that is needed to support any of these services and any future services that 
follows the same pattern. 

Public Methods
```
getRequestParameters({bodyType, method, authnMethod, requestArgs, httpArgs, params}={bodyType: ‘urlEncoded’, method: ‘GET’})
```
Builds the request message and constructs the HTTP headers. This is the starting point for a pipeline that will: 
- construct the request message 
- add/remove information to/from the request message in the way a specific client authentication method requires. 
- gather a set of HTTP headers like Content-type and Authorization. 
- serialize the request message into the necessary format (JSON, urlencoded, signed JWT)
Returns: Object<string, Object> contains difference information such as the uri, body, and httpArgs based on the service
 
 ```
parseResponse({info, sformat, state, params}={})
```
This the start of a pipeline that will: 
- Deserializes a response into it's response message class or an ErrorResponse if it's an error message 
- verifies the correctness of the response by running the verify method belonging to the message class used.
Returns: Response instance such as an ErrorResponse

```
updateServiceContext(resp, state, params)
```
Modifies the passed in serviceContext based on the parsed response.
 
``
parseErrorMessage(response, bodyType)
```
Deal with a request response
Returns: ErrorMessage class instance


### ServiceContext Class 
```
ServiceContext(keyjar, config, params)
```

This class keeps information that a client needs to be able to talk to a server. Some of this information comes 
from configuration and some from dynamic provider info discovery or client registration. But information is also 
picked up during the conversation with a server.

## Global Methods

### Factory method
```
Factory(reqName, serviceContext, stateDb, clientAuthnMethod, serviceConfiguration) 
```

Global function that fetches the service object based on the service name and initializes the 
service object with the httpLib, keyJar, and clientAuthenticationMethod params.

### OicFactory method
```
OicFactory(reqName, serviceContext, stateDb, clientAuthnMethod, serviceConfiguration)
```

A similar factory function, called OicFactory exists in the OIC folder to fetch the OIC service objects

### buildServices method
```
buildServices(serviceDefinitions, serviceFactory, serviceContext, stateDb, clientAuthMethod)
```

Takes a dictionary with a reference to which service subclass that should be instantiated as key and specific service 
configuration for that instance as value.

### List of services provided

OAuth2:
* AccessToken
* Authorization
* ProviderInfoDiscovery
* RefreshAccessToken

OIDC:
* AccessToken
* Authorization
* CheckId
* CheckSession
* EndSession
* ProviderInfoDiscovery
* RefreshAccessToken
* Registration
* UserInfo

## Client Authentication methods
* BearerBody
* BearerHeader
* ClientSecretBasic
* ClientSecretJWT
* ClientSecretPost
* PrivateKeyJWT

## Usage Examples

```
serviceSpec = [(('ProviderInfoDiscovery', {}),
    ('Registration', {}),
    ('Authorization', {}),
    ('AccessToken', {}),
    ('RefreshAccessToken', {}),
    ('UserInfo', {})];
```

Service Request and Response

```
let service = buildServices(serviceSpec, factory, serviceContext, new DB(), CLIENT_AUTHN_METHOD);
```

KeyJar contains the RP’s signing and encryting keys. It’s an  OIDCMsg KeyJar instance
service is a dictionary with services identifiers as keys and OIDCService instances as values.

Next the serviceContext class is instantiated : 

```
let serviceContext = new ServiceContext(
getKey,
{
    "client_metadata":
        {
            "application_type": "web",
            "application_name": "rphandler",
            "contacts": ["ops@example.org"],
            "response_types": ["code"],
            "scope": ["openid", "profile", "email", "address", "phone"],
            "token_endpoint_auth_method": ["client_secret_basic",
                                           'client_secret_post'],
        },
    "redirect_uris": ["{}/authz_cb".format(BASEURL)],
    'behaviour':
        {
            "jwks_uri": "{}/static/jwks.json".format(BASEURL)
        }
    }
)

serviceContext.service = service;
```

We will keep all the session information in the ServiceContext instance. 

Let’s walk through an example of a service to understand the request response workflow using the client. 

In this case we will be looking at the providerInfo service. A similar interface can be followed for other services as well by calling the client’s corresponding service method such as client.register or client.authorize. 

Service ProviderInfo will return the Provider Info service instance and running the method discoverProviderInfo of the client will return the information necessary to do a HTTP request. 

discoverProviderInfo method of the client gets the OpenID Connect providers discovery URL from the serviceContext instance. 

```
const info = service[‘provider_info’].getRequestParameters();
```

 Info will now contain: 
 
 ```
{'uri': 'https://example.com/.well-known/openid-configuration'}
```
 
Doing HTTP GET on the provided URL should get us the provider info which is a JSON document: 

```
{
"version": "3.0",
"token_endpoint_auth_methods_supported": [
    "client_secret_post", "client_secret_basic",
    "client_secret_jwt", "private_key_jwt"],
"claims_parameter_supported": True,
"request_parameter_supported": True,
"request_uri_parameter_supported": True,
"require_request_uri_registration": True,
"grant_types_supported": ["authorization_code",
                          "implicit",
                          "urn:ietf:params:oauth:grant-type:jwt-bearer",
                          "refresh_token"],
"response_types_supported": ["code", "id_token",
                             "id_token token",
                             "code id_token",
                             "code token",
                             "code id_token token"],
"response_modes_supported": ["query", "fragment",
                             "form_post"],
"subject_types_supported": ["public", "pairwise"],
"claim_types_supported": ["normal", "aggregated",
                          "distributed"],
"claims_supported": ["birthdate", "address",
                     "nickname", "picture", "website",
                     "email", "gender", "sub",
                     "phone_number_verified",
                     "given_name", "profile",
                     "phone_number", "updated_at",
                     "middle_name", "name", "locale",
                     "email_verified",
                     "preferred_username", "zoneinfo",
                     "family_name"],
"scopes_supported": ["openid", "profile", "email",
                     "address", "phone",
                     "offline_access", "openid"],
"userinfo_signing_alg_values_supported": [
    "RS256", "RS384", "RS512",
    "ES256", "ES384", "ES512",
    "HS256", "HS384", "HS512",
    "PS256", "PS384", "PS512", "none"],
"id_token_signing_alg_values_supported": [
    "RS256", "RS384", "RS512",
    "ES256", "ES384", "ES512",
    "HS256", "HS384", "HS512",
    "PS256", "PS384", "PS512", "none"],
"request_object_signing_alg_values_supported": [
    "RS256", "RS384", "RS512", "ES256", "ES384",
    "ES512", "HS256", "HS384", "HS512", "PS256",
    "PS384", "PS512", "none"],
"token_endpoint_auth_signing_alg_values_supported": [
    "RS256", "RS384", "RS512", "ES256", "ES384",
    "ES512", "HS256", "HS384", "HS512", "PS256",
    "PS384", "PS512"],
"userinfo_encryption_alg_values_supported": [
    "RSA1_5", "RSA-OAEP", "RSA-OAEP-256",
    "A128KW", "A192KW", "A256KW",
    "ECDH-ES", "ECDH-ES+A128KW", "ECDH-ES+A192KW", "ECDH-ES+A256KW"],
"id_token_encryption_alg_values_supported": [
    "RSA1_5", "RSA-OAEP", "RSA-OAEP-256",
    "A128KW", "A192KW", "A256KW",
    "ECDH-ES", "ECDH-ES+A128KW", "ECDH-ES+A192KW", "ECDH-ES+A256KW"],
"request_object_encryption_alg_values_supported": [
    "RSA1_5", "RSA-OAEP", "RSA-OAEP-256", "A128KW",
    "A192KW", "A256KW", "ECDH-ES", "ECDH-ES+A128KW",
    "ECDH-ES+A192KW", "ECDH-ES+A256KW"],
"userinfo_encryption_enc_values_supported": [
    "A128CBC-HS256", "A192CBC-HS384", "A256CBC-HS512",
    "A128GCM", "A192GCM", "A256GCM"],
"id_token_encryption_enc_values_supported": [
    "A128CBC-HS256", "A192CBC-HS384", "A256CBC-HS512",
    "A128GCM", "A192GCM", "A256GCM"],
"request_object_encryption_enc_values_supported": [
    "A128CBC-HS256", "A192CBC-HS384", "A256CBC-HS512",
    "A128GCM", "A192GCM", "A256GCM"],
"acr_values_supported": ["PASSWORD"],
"issuer": "https://example.com",
"jwks_uri": "https://example.com/static/jwks_tE2iLbOAqXhe8bqh.json",
"authorization_endpoint": "https://example.com/authorization",
"token_endpoint": "https://example.com/token",
"userinfo_endpoint": "https://example.com/userinfo",
"registration_endpoint": "https://example.com/registration",
"end_session_endpoint": "https://example.com/end_session"}
```

This info is passed into parseResponse:
```
const response = service['provider_info'].parseResponse(providerInfoResponse);
```

parseResponse will parse and verify the response. One such verification is to check that the value provided as issuer is the same as the URL used to fetch the information without the ‘.well-known’ part. In our case the exact value that the webfinger query produced.
The parsed response is then passed onto the updateServiceContext method of the client instance which returns the client info after it has been updated with the latest info from the parsed response : 

```
service['provider_info'].updateServiceContext(response);
```
 
The serviceContext now contains the following info: 
```
serviceContext.providerInfo.claims['issuer']: https://example.com
serviceContext.providerInfo.claims['authorization_endpoint'] : https://example.com/authorization 
The whole response from the OP was stored in the serviceContext instance so its accessible in the future.
```

We can use this information to register the RP with the OP.
