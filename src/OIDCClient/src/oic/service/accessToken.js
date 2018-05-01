const OAuth2AccessToken =
    require('../../oauth2/service/accessToken').AccessToken;
const OIDCRequests = require('../../../nodeOIDCMsg/src/oicMsg/oic/requests');
const OIDCResponses = require('../../../nodeOIDCMsg/src/oicMsg/oic/responses');

/**
 * AccessToken
 * @class
 * @constructor
 * @extends OAuth2AccessToken
 */
class AccessToken extends OAuth2AccessToken {
  /**
   * @param {ServiceContext} serviceContext Contains information that a client needs to be able to talk to a server
   * @param {DB} stateDb DB class instance
   * @param {string} clientAuthnMethod One of the six client authentication methods : bearer_body, bearer_header, client_secret_basic, 
   * client_secret_jwt, client_secret_post, private_key_jwt 
   * @param {Object.<string, string>} conf Client configuration that contains information such as client Metadata
   */
  constructor(serviceContext, stateDb, clientAuthnMethod=null, conf=null) {
    super(serviceContext, stateDb, clientAuthnMethod, conf);
    this.msgType = OIDCRequests.AccessTokenRequest;
    this.responseCls = OIDCResponses.AccessTokenResponse;
    this.errorMsg = OIDCResponses.ResponseMessage;
    this.endpoint = 'https://example.org/op/token';
  }

  updateServiceContext(resp, state='', params){
    let _idt = resp.claims['verified_id_token'];
    let nonceState = null;
    if (_idt){
      try{
        nonceState = this.getStateByNonce(_idt['nonce'])
      }catch(err){
        //throw new Error('Unknown nonce value');
        //throw new JSError('Unknown nonce value', 'ValueError');      
      }
      if (nonceState != state){
        //throw new Error('Someone has messed with nonce');
        //throw new JSError('Someone has messed with nonce', 'ParameterError');
      }
    }
    this.storeItem(resp, 'token_response', state);    
  }
}

module.exports.AccessToken = AccessToken;