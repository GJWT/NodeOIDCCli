const Service = require('../../service').Service;
const Message = require('../../../nodeOIDCMsg/src/oicMsg/message');
const ErrorResponse = require('../../../nodeOIDCMsg/src/oicMsg/oauth2/responses').ErrorResponse;
const CheckIdRequest = require('../../../nodeOIDCMsg/src/oicMsg/oic/requests').CheckIdRequest;

/**
 * CheckID
 * @class
 * @constructor
 * @extends Service
 */
class CheckID extends Service {
  /**
   * @param {ServiceContext} serviceContext Contains information that a client needs to be able to talk to a server
   * @param {DB} stateDb DB class instance
   * @param {string} clientAuthnMethod One of the six client authentication methods : bearer_body, bearer_header, client_secret_basic, 
   * client_secret_jwt, client_secret_post, private_key_jwt 
   * @param {Object.<string, string>} conf Client configuration that contains information such as client Metadata
   */
  constructor(serviceContext, stateDb, clientAuthnMethod=null, conf=null) {
    super(serviceContext, stateDb, clientAuthnMethod, conf);
    this.msgType = CheckIdRequest;
    this.responseCls = Message;
    this.errorMsg = ErrorResponse;
    this.endpointName = '';
    this.synchronous = true;
    this.request = 'checkId';
    this.preConstruct = [this.oicPreConstruct];
  }

  oicPreConstruct(requestArgs, request, params) {
    requestArgs = request.multipleExtendRequestArgs(requestArgs, params['state'], ['id_token'], ['auth_response', 'token_response', 'refresh_token_response']);
    let list = [requestArgs, {}];
    return list;
  }
}

module.exports.CheckID = CheckID;