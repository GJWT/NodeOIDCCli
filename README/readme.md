## NodeOIDCClient README

OpenID Connect and OAuth2 (O/O) are both request-response protocols. The client
sends a request and the server responds either direct on the same connection or
after a while on another connection. The client here is a piece of software that
implements O/O and works on behalf of an application.

The client follows the same pattern disregarding which request/response it is
dealing with. It does the following when sending a request:

1. Gathers the request arguments

2. If client authentication is involved it gathers the necessary data for that.

3. If the chosen client authentication method involved adding information to
the request it does so.

4. Adds information to the HTTP headers like Content-Type

5. Serializes the request into the expected format


After that follows the act of sending the request to the server and receiving the 
response from it. Once the response have
been received, The client will follow this path:

1. Deserialize the received message into a internal format

2. Verify that the message was correct. That it contains the required claims and 
that all claims are of the correct data type. If it’s signed and/or encrypted
verify signature and/or decrypt.

3. Store the received information in a data base and/or passes it on to the 
application. Oiccli is built to allow clients to be constructed that supports any 
number and type of request-response services. 

The basic Open ID Connect set is:

* Webfinger

* Dynamic provider information discovery

* Dynamic client registration

* Authorization/Authentication request

* Access token request

* User info request

To these one can add services like session management and token introspection. The
only thing we can be sure of is that this is not the final set of services, there
will be more. And there will be variants of the standard ones. Like when you want 
to add multi lateral federation support to provider information discovery and
client registration.

Over all it seemed like a good idea to write a piece of code that implements all 
the functionality that is needed to support any of this services and any future 
services that follows the same pattern.


### The request pipeline
Below follows a description of the parts of the request pipeline in the order they
are called.

The overall call sequence looks like this:

```
do_request_init
  request_info
    construct
      do_pre_construct (#)
      gather_request_args
      do_post_construct (#)
  init_authentication_method
  uri_and_body
    endpoint
  update_http_args
```
  
The result of the request pipeline is a dictionary that in its simplest form will
look something like this:

```
{
  'uri'
      : 'https://example.com/authorize?response_type=code&state=stateclient_id=client_id&scope=openid&redirect_uri=https%3A%2F%2Fexample.com%2Fcli%2Fauthz_cb&nonce=P1B1nPCnzU4Mwg1hjzxkrA3DmnMQKPWl'
}
```

It will look like that when the request is to be transmitted as the urlencoded query
part of a HTTP GET operation.If instead a HTTP POST with a json body is expected the
outcome of do_request_init will be something like this :

``` 
{
  'uri' : 'https://example.com/token',
  'body': 'grant_type=authorization_code&redirect_uri=https%3A%2F%2Fexample.com%2Fcli%2Fauthz_cb&code=access_code&client_id=client_id',
  'h_args' : {
      'headers' : {
          'Authorization' : 'Basic Y2xpZW50X2lkOnBhc3N3b3Jk',
          'Content-Type' : 'application/x-www-form-url encoded',
      }
  }
}
```

Here you have the url that the request should go to, the body of the request and header 
arguments to add to the HTTP request.

### The request pipeline methods info
*InitAuthenticationMethod*

Implemented in nodeOIDCClient/src/oiccli/src/service.js.initAuthenticationMethod(). Supports
6 different client authentication/authorization methods : 

* #### BearerBody 
Adds the client access token information to the request body.

* #### BearerHeader 
Adds the client access token information to the request header

* #### ClientSecretBasic 
Adds confidential client authentication information to the request header such as a username
and password.

* #### ClientSecretJWT
Contains the functionality for choosing the algorithm for Client Secret JWT and fetching the 
signing key

* #### ClientSecretPost
Adds the client secret information and and client id to the request. 

* #### PrivateKeyJWT
Contains the functionality for choosing the algorithm for Private Key JWT and fetching the 
signing key


TODO : 
Currently README only contains necessary information for the PRs. Will add more details to the README with each PR.