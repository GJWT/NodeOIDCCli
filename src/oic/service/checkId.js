const Service = require('../../service');

class CheckID extends Service {
  constructor() {
    super();
    this.msgType = oic.CheckIDRequest;
    this.responseCls = Message;
    this.errorMsg = ErrorResponse;
    this.endpointName = '';
    this.synchronous = true;
    this.request = 'checkId';
  }

  init(httpLib, keyJar, clientAuthnMethod) {
    httpLib = httpLib || null;
    keyJar = keyJar || null;
    clientAuthnMethod = clientAuthnMethod || null;
    super.init(httpLib, keyJar, clientAuthnMethod);
    this.preConstruct = [this.oicPreConstruct];
  }

  oicPreConstruct(cliInfo, requestArgs, kwargs) {
    requestArgs = requestArgs || null;
    requestArgs = this.setIdToken(cliInfo, requestArgs, kwargs);
    let list = [requestArgs, {}];
    return list;
  }
}

module.exports.CheckID = CheckID;