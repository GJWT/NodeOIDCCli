var Token = require('../oicMsg/src/models/tokenProfiles/token');

function WebFinger() {};

LINK.prototype = new Token();
LINK.prototype = Object.create(Token.prototype);
LINK.prototype.constructor = LINK;

function LINK() {
  this.cParam = {
    'rel': {'type': str, 'required': True},
    'type': {'type': str, 'required': False},
    'href': {'type': str, 'required': False},
    'titles': {'type': dict, 'required': False},
    'properties': {'type': dict, 'required': False},
  };
};

function linkDeser(val, sformat) {
  sformat = sformat || 'urlencoded';
  var sformats = ['dict', 'json'];
  if (val instanceof lINK) {
    return val;
  } else if (sformats.indexOf(sformat) !== -1) {
    if (!(val instanceof String)) {
      val = json.dumps(val);
      sformat = 'json';
    }
  }
  return LINK().deserialize(val, sformat);
};

function msgSer(inst, sformat, lev = 0) {
  var formats = ['urlencoded', 'json'];
  if (formats.indexOf(sformat) !== -1) {
    if (inst instanceof dict) {
      if (sformat == 'json') {
        res = json.dumps(inst);
      } else {
        for (var i = 0; i < Object.keys(inst).length; i++) {
          var key = Object.keys(inst)[i];
          var val = inst[key];
          res = urlencode([(key, val)]);
        }
      }
    } else if (inst instanceof LINK) {
      res = inst.serialize(sformat, lev);
    } else {
      res = inst;
    }
  } else if (sformat == 'dict') {
    if (isinstance(inst, LINK)) {
      res = inst.serialize(sformat, lev);
    } else if (inst instanceof dict) {
      res = inst;
    } else if (inst instanceof String) {
      res = inst;
    } else {
      console.log('Wrong type');
    }
  } else {
    console.log('Unknown sformat');
  }
  return res;
};

JRD.prototype = new Token();
JRD.prototype = Object.create(Token.prototype);
JRD.prototype.constructor = JRD;

function JRD() {
  this.claim = {
    'subject': SINGLE_OPTIONAL_STRING,
    'aliases': OPTIONAL_LIST_OF_STRINGS,
    'properties': SINGLE_OPTIONAL_DICT,
    'links': REQUIRED_LINKS
  };
};

function URINormalizer() {};

URINormalizer.prototype.hasScheme = function(inp) {
  if (inp.indexOf('://')) {
    return true;
  } else {
    var authority = inp.replace('/', '#').replace('?', '#').split('#')[0];

    if (authority.indexOf(':')) {
      var pair = authority.split(':', 1);
      try {
        assert.isFalse(re.match('^\d+$', hostOrPort));
      } catch (err) {
        return false;
      }
    } else {
      return false;
    }
  }
  return true;
};

URINormalizer.prototype.acctSchemeAssumed = function(inp) {
  if (inp.indexOf('@')) {
    host = inp.split('@')[-1];
    return !(
        (host.indexOf(':') !== -1) || (host.indexOf('/') !== -1) ||
        (host.indexOf('?') !== -1));
  } else {
    return false;
  }
};

URINormalizer.prototype.normalize = function(inp) {
  if (this.hasScheme(inp)) {
    return;
  } else if (this.acctSchemeAssumed(inp)) {
    inp = 'acct:' + inp;
  } else {
    inp = 'https://' + inp;
  }
  return inp.split('#')[0];
};

function WebFinger() {};

WebFinger.prototype.init = function(defaultRel, httpd) {
  defaultRel = defaultRel || null;
  httpd = httpd || null;
  this.defaultRel = defaultRel;
  this.httpD = httpD;
  this.jrd = null;
  this.events = null;
};

WebFinger.prototype.query = function(resource, rel) {
  rel = rel || null;
  var resource = URINormalizer().normalize(resource);
  info = [('resource', resource)];
  if (rel == null) {
    if (this.defaultRel) {
      info.push('rel', this.defaultRel);
    }
  } else if (rel instanceof str) {
    info.push(('rel', rel));
  } else {
    for (var i = 0; i < rel.length; i++) {
      info.push(('rel', val));
    }
  }
  if (resource.startsWith('http')) {
    var part = urlParse(resource);
    var host = part.hostName;
    if (part.port !== null) {
      host += ':' + str(part.port);
    }
  } else if (resource.startsWith('acct:')) {
    host = resource.split('@')[-1];
    host = host.replace('/', '#').replace('?', '#').split('#')[0];
  } else if (resource.startsWith('device:')) {
    host = resource.split(':')[1];
  } else {
    console.log('Unknown schema');
  }
};

WebFinger.prototype.load = function(item) {
  return JRD(json.loads(item));
};

WebFinger.prototype.httpArgs = function(jrd) {
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
};

/**
 * Given a resource find a OpenID connect OP to use
        :param resource: An identifier of an entity
        :return: A URL if an OpenID Connect OP could be found
 */
WebFinger.prototype.discoveryQuery = function(resource) {
  url = this.query(resource, OIC_ISSUER);
  try {
    rsp = this.httpd(url, true);
  } catch (err) {
    console.log(err);
  }

  var statusCodes = [302, 301, 307];
  if (rsp.statusCode === 200) {
    if (this.events) {
      this.events.store('Response', rsp.text);
    }
    this.jrd = this.load(rsp.text);
    if (this.events) {
      this.events.store('JRD Response', this.jrd);
    }
    for (var i = 0; i < this.jrd['links']; i++) {
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
};

WebFinger.prototype.response = function(subject, base, kwargs) {
  this.jrd = JRD();
  this.jrd['subject'] = subject;
  link = LINK();
  link['rel'] = OIC_ISSUER;
  link['href'] = base;
  this.jrd['links'] = [link];
  for (var i = 0; i < kwargs.items().length; i++) {
    this.jrd[k] = v;
  }
  return json.dumps(this.jrd.export());
};