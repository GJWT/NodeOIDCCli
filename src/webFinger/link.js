const SINGLE_OPTIONAL_STRING =
    require('../../oicMsg/oauth2/init').SINGLE_OPTIONAL_STRING;
const SINGLE_OPTIONAL_DICT =
    require('../../oicMsg/oauth2/init').SINGLE_OPTIONAL_DICT;
const OPTIONAL_LIST_OF_STRINGS =
    require('../../oicMsg/oauth2/init').OPTIONAL_LIST_OF_STRINGS;
const Token = require('../../oicMsg/src/models/tokenProfiles/token');

class LINK extends Token {
  constructor(dict) {
    super();
    this.cParam = {
      'rel': {'type': String, 'required': true},
      'type': {'type': String, 'required': false},
      'href': {'type': String, 'required': false},
      'titles': {'type': String, 'required': false},
      'properties': {'type': String, 'required': false},
    };
    return dict;
  }
}

let REQUIRED_LINKS = [[LINK], true, this.msgSer, this.linkDeser, false];

function linkDeser(val, sformat) {
  sformat = sformat || 'urlencoded';
  let sformats = ['dict', 'json'];
  if (val instanceof lINK) {
    return val;
  } else if (sformats.indexOf(sformat) !== -1) {
    if (!(val instanceof String)) {
      val = json.dumps(val);
      sformat = 'json';
    }
  }
  return LINK().deserialize(val, sformat);
}

function msgSer(inst, sformat, lev = 0) {
  let formats = ['urlencoded', 'json'];
  if (formats.indexOf(sformat) !== -1) {
    if (inst instanceof dict) {
      if (sformat == 'json') {
        res = json.dumps(inst);
      } else {
        for (let i = 0; i < Object.keys(inst).length; i++) {
          let key = Object.keys(inst)[i];
          let val = inst[key];
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
}

class JRD extends Token {
  constructor(dict) {
    super();
    this.claim = {
      'subject': SINGLE_OPTIONAL_STRING,
      'aliases': OPTIONAL_LIST_OF_STRINGS,
      'properties': SINGLE_OPTIONAL_DICT,
      'links': REQUIRED_LINKS
    };
    return dict;
  }
};

module.exports.LINK = LINK;
module.exports.JRD = JRD;