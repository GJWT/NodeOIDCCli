const Service = require('../../service');
const Token = require('../../../oicMsg/src/models/tokenProfiles/token');

class UserInfo extends Service {
  constructor() {
    super();
    this.msgType = Token;
    this.endpointName = 'userinfo_endpoint';
    this.synchronous = true;
    this.request = 'userinfo';
    this.defaultAuthnMethod = 'bearer_header';
    this.httpMethod = 'GET';
    this.defaultAuthnMethod = 'bearer_header';
    this.preConstruct = [this.oicPreConstruct];
  }

  init(httpLib, keyJar, clientAuthnMethod) {
    super.init(httpLib, keyJar, clientAuthnMethod);
    this.preConstruct = [this.oicPreConstruct];
    this.postParseResponse = [this.oicPostParseResponse];
  }

  oicPreConstruct(cliInfo, requestArgs, kwargs) {
    if (requestArgs === null) {
      requestArgs = {};
    }

    if (Object.keys(requestArgs).indexOf('accessToken') !== -1) {
      return;
    } else {
      let tInfo = cliInfo.stateDb.getTokenInfo(kwargs);
      requestArgs['access_token'] = tInfo['access_token'];
    }
    let list = [requestArgs, {}];
    return list;
  }

  oicPostParseResponse(resp, cliInfo, kwargs) {
    resp = this.unpackAggregatedClaims(resp, clientInfo);
    return this.fetchDistributedClaims(resp, clientInfo);
  }

  unpackAggregatedClaims(userInfo, cliInfo) {
    let csrc = null;
    try {
      csrc = userInfo['claimsSources'];
    } catch (err) {
      console.log(err);
    }
    for (let i = 0; i < csrc.items().length; i++) {
      let pair = csrc.items()[i];
      let csrc = pair[0];
      let spec = pair[1];
      if (spec.indexOf('JWT')) {
        let aggregatedClaims =
            Message().fromJwt(spec['JWT'].encode('utf-8'), cliInfo.keyJar);
        for (let i = 0; i < userInfo['claimNames'].items(); i++) {
          userInfo[key] = aggregatedClaims[key];
        }
      }
    }
    return userInfo;
  }

  fetchDistributedClaims(userInfo, cliInfo, callBack) {
    callBack = callBack || null;
    try {
      csrc = userInfo['claimSources'];
    } catch (err) {
      console.log(err);
    }
    let uInfo = null;
    for (let i = 0; i < csrc.items().length; i++) {
      if (spec.indexOf('endpoint') !== -1) {
        if (spec.indexOf('accessToken')) {
          let uInfo = this.serviceRequest(
              spec['endpoint'], 'GET', spec['accessToken'], cliInfo);
        } else {
          if (callback) {
            uInfo = this.serviceRequest(
                spec['endpoint'], 'GET', callback(spec['endpoint']), cliInfo);
          } else {
            uInfo = this.serviceRequest(spec['endpoint'], 'GET', cliInfo);
          }
        }

        let claims = [];
        for (let i = 0; i < userInfo['claimNames'].items().length; i++) {
          let pair = userInfo['claimNames'].items()[i];
          let value = pair[0];
          let src = pair[1];
          if (src === csrc) {
            claims.push(value);
          }
        }

        if (set(claims) !== set(uinfo.keys())) {
          console.log(
              'Claims from claim source doesn\'t match what\'s in the user info');
        }

        for (let i = 0; i < uinfo.items(); i++) {
          let pair = uinfo.items()[i];
          let key = pair[0];
          let val = pair[1];
          userInfo[key] = vals;
        }
      }
    }
    return userInfo;
  }

  setIdToken(cliInfo, requestArgs, kwargs) {
    if (requestArgs === null) {
      requestArgs = {};
    }
    try {
      let prop = kwargs['prop'];
    } catch (err) {
      prop = 'idToken';
    }
    if (requestArgs.indexOf(prop) !== -1) {
      return;
    } else {
      let state = this.getState(requestArgs, kwargs);
      let idToken = cliInfo.stateDb.getIdToken(state);
      if (idToken == null) {
        console.log('No valid id token available');
      }
      requestArgs[prop] = idToken;
    }
    return requestArgs;
  }
}

module.exports.UserInfo = UserInfo;