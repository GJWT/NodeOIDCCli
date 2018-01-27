var fs = require('fs');
var shell = require('shelljs');

function requestObjectEncryption(msg, clientInfo, kwargs) {
  var encalg = null;
  try {
    encalg = kwargs['request_object_encryption_alg'];
  } catch (err) {
    try {
      encalg = clientInfo.behavior['request_object_encryption_alg'];
    } catch (err) {
      return msg;
    }
  }
  var encenc = null;
  try {
    encenc = kwargs['request_object_encryption_enc'];
  } catch (err) {
    try {
      encenc = clientInfo.behavior['request_object_encryption_enc'];
    } catch (err) {
      throw new Error('No request object encryption enc specified');
    }
  }
  var jwe = new JWE(msg, encalg, encenc);
  var kty = jwe.alg2KeyType(encalg);

  var kid = null;
  try {
    kid = kwargs['enc_kid'];
  } catch (err) {
    kid = '';
  }

  if (kwargs.indexOf('target') === -1) {
    throw new Error('Missing Required Attribute - No target specified');
  }

  if (kid) {
    keys = clientInfo.keyJar.getEncyptKey(kty, kwargs['target'], kid);
    jwe['kid'] = kid;
  } else {
    keys = clientInfo.keyJar.getEncryptKey(kty, kwargs['target']);
  }
  return jwe.encrypt(keys);
};

/**
 * Contructs a special redirect_uri to be used when communicating with
    one OP. Each OP should get their own redirect_uris.
 * @param {*} localDir : Local directory in which to place the file
 * @param {*} basePath : Base URL to start with
 * @param {*} kwargs
 * return: 2-tuple with (filename, url)
 */
function constructRquestUri(localDir, basePath) {
  var fileDir = localDir;

  if (!fs.existsSync(fileDir)) {
    shell.mkdir('-p', fileDir);
  }

  var webPath = basePath;
  var name = rndStr(10) + '.jwt';
  var fileName = fileDir + '/' + name;
  while (!fs.lstatSync(fileName).isFile()) {
    name = rndStr(10);
    fileName = os.path.join(fileDir, name);
  }
  var webName = webPath + name;
  var pair = [fileName, webName];
};