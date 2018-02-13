const WF_URL = 'https://%s/.well-known/webfinger';
const OIC_ISSUER = 'http://openid.net/specs/connect/1.0/issuer';
const URINormalizer = require('./uriNormalizer').URINormalizer;

class WebFinger {
  constructor() {}

  init(defaultRel, httpD) {
    this.defaultRel = defaultRel || null;
    this.httpD = httpD || null;
    this.jrd = null;
    this.events = null;
  }

  query(resource, rel) {
    rel = rel || null;
    let uriNormalizer = new URINormalizer();
    resource = uriNormalizer.normalize(resource);
    let info = {};
    info['resource'] = resource;
    if (rel == null) {
      if (this.defaultRel) {
        info['rel'] = this.defaultRel;
      }
    } else if (rel instanceof String) {
      info['rel'] = rel;
    } else {
      for (let i = 0; i < rel.length; i++) {
        let val = rel[i];
        if (info['rel']) {
          info['rel'].push(val);
        } else {
          info['rel'] = [val];
        }
      }
    }
    if (resource.startsWith('http')) {
      let part = urlParse(resource);
      var host = part.hostName;
      if (part.port !== null) {
        host += ':' + str(part.port);
      }
    } else if (resource.startsWith('acct:')) {
      let list = resource.split('@');
      host = list[list.length - 1];
      host = host.replace('/', '#').replace('?', '#').split('#')[0];
    } else if (resource.startsWith('device:')) {
      host = resource.split(':')[1];
    } else {
      console.log('Unknown schema');
    }
    return WF_URL.replace('%s', host) + '?' + this.urlEncode(info);
  }

  urlEncode(dict) {
    let str = [];
    for (let i = 0; i < Object.keys(dict).length; i++) {
      let key = Object.keys(dict)[i];
      let val = dict[key];
      if (val instanceof Array) {
        for (let i = 0; i < val.length; i++) {
          str.push(
              encodeURIComponent('rel') + '=' + encodeURIComponent(val[i]));
        }
      } else {
        str.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
      }
    }
    return str.join('&');
  }

  load(item) {
    return JRD(json.loads(item));
  }

  httpArgs(jrd) {
    if (jrd == null) {
      if (this.jrd) {
        jrd = this.jrd;
      } else {
        return null;
      }
    }
    return {
      'headers': {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json; charset=UTF-8'
      },
      'body': json.dumps(jrd.export())
    };
  }

  /**
   * Given a resource find a OpenID connect OP to use
   * @param {*} resource An identifier of an entity
   */
  discoveryQuery(resource) {
    url = this.query(resource, OIC_ISSUER);
    try {
      rsp = this.httpd(url, true);
    } catch (err) {
      console.log(err);
    }

    let statusCodes = [302, 301, 307];
    if (rsp.statusCode === 200) {
      if (this.events) {
        this.events.store('Response', rsp.text);
      }
      this.jrd = this.load(rsp.text);
      if (this.events) {
        this.events.store('JRD Response', this.jrd);
      }
      for (let i = 0; i < this.jrd['links']; i++) {
        if (link['rel'] === OIC_ISSUER) {
          if (!link['href'].startsWith('https://')) {
            console.log(' Must be a HTTPS href');
          }
          return link['href'];
        }
      }
      return null;
    } else if (statusCodes.indexOf(rsp.statusCode)) {
      return this.discoveryQuery(rsp.headers['location']);
    } else {
      console.log(rsp.statusCode);
    }
  }

  response(subject, base, kwargs) {
    this.jrd = JRD();
    this.jrd['subject'] = subject;
    link = LINK();
    link['rel'] = OIC_ISSUER;
    link['href'] = base;
    this.jrd['links'] = [link];
    for (let i = 0; i < kwargs.items().length; i++) {
      this.jrd[k] = v;
    }
    return json.dumps(this.jrd.export());
  }
}

module.exports.WebFinger = WebFinger;