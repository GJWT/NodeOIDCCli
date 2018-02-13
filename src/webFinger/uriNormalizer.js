const WF_URL = 'https://%s/.well-known/webfinger';
const OIC_ISSUER = 'http://openid.net/specs/connect/1.0/issuer';

class URINormalizer {
  constructor() {}

  hasScheme(inp) {
    if (inp.indexOf('://') !== -1) {
      return true;
    } else {
      let authority = inp.replace('/', '#').replace('?', '#').split('#')[0];

      if (authority.indexOf(':') !== -1) {
        let hostOrPort = authority.split(':')[1];
        if (hostOrPort.match(/^\d+$/)) {
          return false;
        }
      } else {
        return false;
      }
    }
    return true;
  }

  acctSchemeAssumed(inp) {
    if (inp.indexOf('@') !== -1) {
      let list = inp.split('@');
      let host = list[list.length - 1];
      return !(
          (host.indexOf(':') !== -1) || (host.indexOf('/') !== -1) ||
          (host.indexOf('?') !== -1));
    } else {
      return false;
    }
  }

  normalize(inp) {
    if (this.hasScheme(inp)) {
    } else if (this.acctSchemeAssumed(inp)) {
      inp = 'acct:' + inp;
    } else {
      inp = 'https://' + inp;
    }
    return inp.split('#')[0];
  }
}

module.exports.URINormalizer = URINormalizer;
module.exports.OIC_ISSUER = OIC_ISSUER;