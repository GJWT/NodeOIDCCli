const Service = require('../../service');

class CheckSession extends Service {
  constructor() {
    super();
    this.msgType = oic.CheckSessionRequest;
    this.responseCls = Message;
    this.errorMsg = ErrorResponse;
    this.endpointName = '';
    this.synchronous = true;
    this.request = 'checkSession';
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
    return requestArgs, {};
  }
}

module.exports.CheckSession = CheckSession;