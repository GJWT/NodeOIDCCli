const base64url = require('base64url');
const crypto = require('crypto');

function addCodeChallenge(clientInfo, state) {
  let cvLen = null;
  try {
    cvLen = clientInfo.config['code_challenge']['length'];
  } catch (err) {
    cvLen = 64;
  }

  let codeVerifier = unreserved(cvLen);
  let cv = encode(codeVerifier);

  let method = null;
  try {
    method = clientInfo.config['code_challenge']['method'];
  } catch (err) {
    method = 'sha256';
  }
  try {
    let m = crypto.createHmac(method, '');
    m.update(cv);
    let hv = m.digest('hex');
    var codeChallenge = decode(base64url.encode(encode(hv)));

  } catch (err) {
    throw new Error('PKCE Transformation method:{}');
  }

  clientInfo.stateDb.addInfo(
      state, {'code_verifier': codeVerifier, 'code_challenge_method': method});
  let codeDict = {
    'code_challenge': codeChallenge,
    'code_challenge_method': method
  };
  return codeDict;
}

function getCodeVerifier(clientInfo, state) {
  return clientInfo.stateDb[state]['code_verifier'];
}

function unreserved(len) {
  let rdmString = '';
  for (; rdmString.length < len;
       rdmString += Math.random().toString(36).substr(2))
    ;
  return rdmString.substr(0, len);
}

function encode(str) {
  return 'b\'' + str;
}

function decode(str) {
  return str.substring(2);
}

module.exports.addCodeChallenge = addCodeChallenge;
module.exports.getCodeVerifier = getCodeVerifier;