/**
 * @fileoverview Node JS Library for Message protocols
 *
 * @description 
 * <pre>
 * OpenID Connect and OAuth2 (O/O) are both request-response protocols. The client sends a request
 * and the server responds either direct on the same connection or after a while on another 
 * connection.
 * <pre>
 * When I use client below I refer to a piece of software that implements O/O and works on behalf 
 * of an application.
 * <pre>
 * The client follows the same pattern disregarding which request/response it is dealing with. 
 * I does the following when sending a request:
 * <pre>
 * 1) Gathers the request arguments <pre>
 * 2) If client authentication is involved it gathers the necessary data for that. <pre>
 * 3) If the chosen client authentication method involved adding information to the 
 * request it does so. <pre>
 * 4) Adds information to the HTTP headers like Content-Type <pre>
 * 5) Serializes the request into the expected format <pre>
 * <pre>
 * after that follows the act of sending the request to the server and receiving the response
 * from it. Once the response have been received, The client will follow this path:
 * <pre>
 * 1) Deserialize the received message into a internal format <pre>
 * 2) Verify that the message was correct. That it contains the required claims and that all claims 
 * are of the correct data type. If it’s signed and/or encrypted verify signature and/or decrypt. <pre>
 * 3) Store the received information in a data base and/or passes it on to the application. <pre>
 * oidcservice is built to allow clients to be constructed that supports any number and type
 * of request-response services. The basic Open ID Connect set is: <pre>
 * - Webfinger <pre>
 * - Dynamic provider information discovery <pre>
 * - Dynamic client registration <pre>
 * - Authorization/Authentication request <pre>
 * - Access token request <pre>
 * - User info request <pre>
 * <pre>
 * To these one can add services like session management and token introspection. The only thing 
 * we can be sure of is that this is not the final set of services, there will be more. And there 
 * will be variants of the standard ones. Like when you want to add multi lateral federation 
 * support to provider information discovery and client registration.
 * <pre>
 * Over all it seemed like a good idea to write a piece of code that implements all the 
 * functionality that is needed to support any of this services and any future services that 
 * follows the same pattern.
 * */