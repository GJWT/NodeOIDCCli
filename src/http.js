function HTTPLib() {};

HTTPLib.prototype.init = function(caCerts, verifySsl, keyJar, clientCert) {
  this.keyJar = keyJar || new KeyJar(verifySsl);
  this.requestArgs = {'allowRedirects': false};
  this.cookieJar = FileCookieJar();
  this.caCerts = caCerts;

  if (caCerts) {
    if (verifySsl == false) {
      console.log('Conflict : caCerts defined, but verifySsl is False');
    }
    this.requestArgs['verify'] = caCerts;
  } else if (verifySsl) {
    this.reuestArgs['verify'] = true;
  } else {
    this.requestArgs['verify'] = false;
  }

  this.events = null;
  this.reqCallback = null;
  if (clientCert) {
    this.requestArgs['cert'] = clientCert;
  }
};

HTTPLib.prototype.cookies = function() {
  var cookiesDict = {};
  for (var i = 0; i < this.cookieJar.cookies.items().length; i++) {
    var a = this.cookieJar.cookies.items()[i];
    for (var j = 0; j < a.items.length; i++) {
      var b = a.items[j];
      for (var i = 0; i < b.values().length; i++) {
        var cookie = b.values()[i];
        cookieDict[cookie.name] = cookie.value;
      }
    }
  }
  return cookieDict;
};

HTTPLib.prototype.call = function(url, method, kwargs) {
  method = method || 'GET';
  var kwargs = copy.copy(this.requestArgs);
  if (kwargs) {
    kwargs.update(kwargs);
  }
  if (this.cookieJar) {
    kwargs['cookies'] = this.cookies();
  }
  if (this.reqCallback != null) {
    kwargs = this.reqCallback(method, url, kwargs);
  }
  try {
    r = requests.request(method, url, kwargs);
  } catch (err) {
    console.log('Http request failed');
  }

  if (this.events != null) {
    this.events.store('HTTP response', r, url);
  }

  try {
    var cookie = r.headers['setCookie'];
    try {
      this.setCookie(this.cookieJar, SimpleCookie(cookie));
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
  return r;
};

HTTPLib.prototype.send = function(url, method, kwargs) {
  return this(url, method, kwargs);
};

HTTPLib.prototype.loadCookiesFromFile = function(
    fileName, ignoreDiscard, ignoreExpires) {
  ignoreDiscard = ignoreDiscard || false;
  ignoreExpires = ignoreExpires || false;
  this.cookiesJar.load(fileName, ignoreDiscard, ignoreExpires);
};

HTTPLib.prototype.saveCookiesToFile = function(
    fileName, ignoreDiscard, ignoreExpires) {
  ignoreDiscard = ignoreDiscard || false;
  ignoreExpires = ignoreExpires || false;
  this.cookieJar.save(fileName, ignoreDiscard, ignoreExpires);
};

module.exports.HTTPLib = HTTPLib;