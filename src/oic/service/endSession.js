const Service = require('../../service');

class EndSession extends Service {
  constructor() {
    super();
    this.msgType = oic.CheckIDRequest;
    this.responseCls = Message;
    this.errorMsg = ErrorResponse;
    this.endpointName = 'endSessionEndpoint';
    this.synchronous = true;
    this.request = 'endSession';
  }

  init(httpLib, keyJar, clientAuthnMethod) {
    httpLib = httpLib || null;
    keyJar = keyJar || null;
    clientAuthnMethod = clientAuthnMethod || null;
    super.init(httpLib, keyJar, clientAuthnMethod);
    this.preConstruct = [this.oicPreConstruct];
  }

  oicPreConstruct(cliInfo, requestArgs, kwargs) {
    var requestArgs = this.setIdToken(cliInfo, requestArgs, kwargs);
    let list = [requestArgs, {}];
    return list;
  }
}

module.exports.EndSession = EndSession;