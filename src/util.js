var Token = require('../oicMsg/src/models/tokenProfiles/token');


var JSON_ENCODED = 'application/json';
var URL_ENCODED = 'application/x-www-form-urlencoded';
var DEFAULT_POST_CONTENT_TYPE = URL_ENCODED;

var PAIRS = {
  'port': 'port_specified',
  'domain': 'domain_specified',
  'path': 'path_specified'
};

var ATTRS = {
  'version': null,
  'name': '',
  'value': null,
  'port': null,
  'port_specified': false,
  'domain': '',
  'domain_specified': false,
  'domain_initial_dot': false,
  'path': '',
  'path_specified': false,
  'secure': false,
  'expires': null,
  'discard': true,
  'comment': null,
  'comment_url': null,
  'rest': '',
  'rfc2109': true
};

function Util() {};

/**
 * Create the information pieces necessary for sending a request.
 * Depending on whether the request is done using GET or POST the request
 * is placed in different places and serialized into different formats.
 * :param uri: The URL pointing to where the request should be sent
 * :param method: Which method that should be used to send the request
 * :param req: The request as a :py:class:`oicmsg.message.Message` instance
 * :param content_type: Which content type to use for the body
 * :param accept: Whether an Accept header should be added to the HTTP request
 * :param kwargs: Extra keyword arguments.
 * :return:
 */
Util.prototype.getOrPost = function(
    uri, method, req, contentType, accept, kwargs) {
  contentType = contentType || DEFAULT_POST_CONTENT_TYPE;
  accept = accept || null;
  var resp = {};
  var reqActions = ['GET', 'DELETE'];
  var respActions = ['POST', 'PUT'];
  if (reqActions.indexOf(method) !== -1) {
    if (Object.keys(req).length != 0) {
      var reqCpy = req;
      var comp = urlSplit(uri.toString());
      if (comp.query) {
        reqCpy = this.parseQs(comp.query);
      }
      var query = reqCpy.toUrlEncoded().toString();
      resp['uri'] = this.urlunsplit(
          (comp.scheme, comp.netloc, comp.path, query, comp.fragment));
    } else {
      resp['uri'] = uri;
    }
  } else if (respActions.indexOf(method) !== -1) {
    resp['uri'] = uri;
    if (contentType === URL_ENCODED) {
      resp['body'] = req.toUrlEncoded();
    } else if (contentType === JSON_ENCODED) {
      resp['body'] = req.toJson();
    } else {
      console.log('Supported content type');
    }

    var headerExt = {'Content-Type': contentType};
    if (accept) {
      var headerExt = {'Accept': accept};
    }
    if (Object.keys(kwargs).indexOf('headers')) {
      kwargs['headers'].update(headerExt);
    } else {
      kwargs['headers'] = headerExt;
    }
    resp['kwargs'] = kwargs;
  } else {
    console.log('Unsupported HTTP Method');
  }
  return resp;
};

/**
 * PLaces a cookie (a cookielib.Cookie based on a set-cookie header
 * line) in the cookie jar.
 * Always chose the shortest expires time.
 * :param cookiejar:
 * :param kaka: Cookie
 */
Util.prototype.setCookie = function(cookieJar, kaka) {
  for (var i = 0; i < Object.keys(kaka); i++) {
    var cookieName = Object.keys(kaka)[i];
    var morsel = kaka[cookieName];
    var stdAttr = ATTR.copy();
    stdAttr['name'] = cookieName;
    tmp = morsel.codedValue;
    if (temp.startsWith('') && tmp.endsWith('')) {
      stdAttr['value'] = tmp.substring(1, -1);
    } else {
      stdAttr['value'] = tmp;
    }

    stdAttr['version'] = 0;
    attr = '';
    // Copy attributes that have values
    try {
      for (var i = 0; i < Object.keys(morsel).length; i++) {
        if (ATTRS.indexOf(attr) !== -1) {
          if (morsel[attr]) {
            if (attr === 'expires') {
              stdAttr[attr] = this.getOrPost.http2Time(morsel[attr]);
            } else {
              stdAttr[attr] = morsel[attr];
            }
          }
        } else if (attr === 'maxAge') {
          if (morsel[attr]) {
            stdAttr['expires'] = this.http2Time(morsel[attr]);
          }
        }
      }
    } catch (err) {
      console.log(err);
      continue;
    }

    for (var i = 0; i < Object.keys(PAIRS); i++) {
      if (stdAttr[att]) {
        stdAttr[spec] = true;
      }
    }

    if (stdAttr['domain'] && stdAttr['domain'].startsWith('.')) {
      stdAttr['domainInitialDot'] = true;
    }

    if (morsel['max-age'] === 0) {
      try {
        this.cookieJar.clear(
            std_attr['domain'], std_attr['path'], std_attr['name']);
      } catch (err) {
        console.log(err);
      }
    } else {
      if (stdAttr.indexOf('version') !== -1) {
        try {
          stdAttr['version'] = stdAttr['version'].split(',')[0];
        } catch (err) {
          console.log(err);
        }
      }
      var newCookie = new Cookie(stdAttr);
      this.cookieJar.setCookie(newCookie);
    }
  }
};

Util.prototype.matchTo = function(val, vlist) {
  if (vlist instanceof String) {
    if (vlist.startsWith(val)) {
      return true;
    }
  } else {
    for (var i = 0; i < vlist.length; i++) {
      var v = vlist[i];
      if (v.startsWith(val)) {
        return true;
      }
    }
  }
  return false;
};

/** :param reqresp: Class instance with attributes: ['status', 'text',
       'headers', 'url']
 * :param body_type: If information returned in the body part
 * :return: Verified body content type
 */
Util.prototype.verifyHeader = function(reqResp, bodyType) {
  try {
    var cType = reqResp.headers._ctype;
  } catch (err) {
    if (bodyType) {
      return bodyType;
    } else {
      return 'txt';
    }
  }

  if (bodyType === '') {
    if (this.matchTo('application/json', cType)) {
      bodyType = 'json';
    } else if (this.matchTo('application/jwt', cType)) {
      bodyType = 'jwt';
    } else if (this.matchTo(URL_ENCODED, cType)) {
      bodyType = 'urlEncoded';
    } else {
      bodyType = 'txt';
    }
  } else if (bodyType === 'json') {
    if (this.matchTo('application/json', cType)) {
      bodyType = 'jwt';
    } else if (this.matchTo('application/jwt', cType)) {
      bodyType = 'jwt';
    } else {
      console.log('Wrong Content Type');
    }
  } else if (bodyType === 'jwt') {
    if (!(this.matchTo('application/jwt', cType))) {
      console.log('Wrong Content Type');
    }
  } else if (bodyType === 'urlEncoded') {
    if (!(this.matchTo(DEFAULT_POST_CONTENT_TYPE, _ctype))) {
      if (!(this.matchTo('text/plain', cType))) {
        console.log('Wrong Content Type');
      }
    }
  } else {
    console.log('Unknown return format ' + bodyType);
  }
  console.log('Got body type: ' + bodyType);
  return bodyType;
};

var SORT_ORDER = {'RS': 0, 'ES': 1, 'HS': 2, 'PS': 3, 'no': 4};

Util.prototype.sortSignAlg = function(alg1, alg2) {
  if (SORT_ORDER(alg1.substring(0, 2)) < SORT_ORDER[alg2.substring(0, 2)]) {
    return -1;
  } else if (
      SORT_ORDER(alg1.substring(0, 2)) < SORT_ORDER[alg2.substring(0, 2)]) {
    return 1;
  } else {
    if (alg1 < alg2) {
      return -1;
    } else if (alg1 > alg2) {
      return 1;
    } else {
      return 0;
    }
  }
};

module.exports.Util = Util;