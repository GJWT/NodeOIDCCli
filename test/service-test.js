const SINGLE_REQUIRED_STRING =
    require('../oicMsg/oauth2/init').SINGLE_REQUIRED_STRING;
const SINGLE_OPTIONAL_DICT =
    require('../oicMsg/oauth2/init').SINGLE_OPTIONAL_DICT;
const SINGLE_OPTIONAL_INT =
    require('../oicMsg/oauth2/init').SINGLE_OPTIONAL_INT;
const Token = require('../oicMsg/src/models/tokenProfiles/token');
const Service = require('../src/service.js');

function DummyMessage() {
  this.cParam = {
    'req_str': SINGLE_REQUIRED_STRING,
    'opt_str': SINGLE_OPTIONAL_STRING,
    'opt_int': SINGLE_OPTIONAL_INT,
  }
}

DummyMessage.prototype = new Token();
DummyMessage.prototype = Object.create(Token.prototype);
DummyMessage.prototype.constructor = DummyMessage;

function Response() {}

Response.prototype.init = function(status_code, text, headers) {
  headers = headers || null;
  this.statusCode = statusCode;
  this.text = text;
  this.headers = headers || {'content-type': 'text/plain'};
};

function DummyService() {
  this.msgType = DummyMessage;
}

DummyService.prototype = new Service();
DummyService.prototype = Object.create(Service.prototype);
DummyService.prototype.constructor = DummyService;

describe('Test Dummy Service', function() {
  it('Create service', function() {
    // TODO
  });
});