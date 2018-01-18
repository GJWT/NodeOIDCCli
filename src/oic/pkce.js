
function addCodeChallenge(clientInfo, state){
    var cvLen = null;
    try{
        cvLen = clientInfo.config['code_challenge']['length'];
    }catch(err){
        cvLen = 64;
    }

    var codeVerifier = unreserved(cvLen);
    var cv = codeVerifier.encode();

    var method = null;
    try{
        method = clientInfo.config['code_challenge']['method'];
    }catch(err){
        method = 'S256';
    }
    try{
        var hashMethod = CC_METHOD[method];
        var hv = hashMethod(cv).hexDigest();
        var codeChallenge = b64e(hv.encode()).decode();
    }catch(err){
        throw new Error('PKCE Transformation method:{}');
    }

    clientInfo.stateDb.addInfo(state, codeVerifier, method);
    var codeDict = {"code_challenge": codeChallenge,
    "code_challenge_method": method};
    return codeDict;
};

function getCodeVerifier(clientInfo, state){
    return clientInfo.stateDb[state]['code_verifier'];
};