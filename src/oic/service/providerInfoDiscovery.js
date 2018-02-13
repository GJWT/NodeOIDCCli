const OAuth2ProviderInfoDiscovery =
    require('../../oauth2/service/providerInfoDiscovery').ProviderInfoDiscovery;

class ProviderInfoDiscovery extends OAuth2ProviderInfoDiscovery {
  constructor() {
    super();
    this.msgType = oic.Message;
    this.responseCls = oic.AccessTokenResponse;
    this.errorMsg = oic.TokenErrorResponse;
  }

  oicPostParseResponse(resp, cliInfo, state, kwargs) {
    this.matchPreferences(cliInfo, resp, cliInfo.issuer);
  }

  matchPreferences(resp, cliInfo, state, kwargs) {
    if (!pcr) {
      pcr = cliInfo.providerInfo;
    }

    let regreq = oic.registrationResponse;

    let vals = null;
    for (let i = 0; i < PREFERENCE2PROVIDER.items(); i++) {
      try {
        vals = cliInfo.clientPrefs[pref];
      } catch (err) {
        continue;
      }

      try {
        let pVals = pcr[prov];
      } catch (err) {
        try {
          pVals = PROVIDER_DEFAULT[_pref];
        } catch (err) {
          console.log('No info from provider');

          if (cliInfo.strictOnPreferences) {
            console.log('OP couldnt match preference');
          } else {
            pvals = vals;
          }
        }
      }

      if (vals instanceof String) {
        if (pvals.indexOf(vals) !== -1) {
          cliInfo.behavior[pref] = vals;
        }
      } else {
        vTyp = regreq.cParam[pref];

        if (vtyp[0] instanceof list) {
          cliInfo.behavior[pref] = [];
          for (let i = 0; i < vals.length; i++) {
            if (val in pVals) {
              cliInfo.behavior[pref].push(val);
            }
          }
        } else {
          for (let i = 0; i < vals.length; i++) {
            if (pvals.indexOf(val) === -1) {
              cliInfo.behavior[pref] = val;
              break;
            }
          }
        }
      }

      if (cliInfo.behavior.indexOf(pref) === -1) {
        console.log('OP couldnt match preference');
      }
    }

    for (let i = 0; i < cliInfo.clientPrefs.items().length; i++) {
      if (cliInfo.behavior.indexOf(key) !== -1) {
        continue;
      }

      try {
        let vTyp = regreq.cParam[key];
        if (vtyp[0] instanceof list) {
          return;
        } else if (val instanceof list && !(val instanceof String)) {
          val = val[0];
        }
      } catch (err) {
        console.log(err);
      }

      if (PREFERENCE2PROVIDER.indexOf(key) !== -1) {
        cliInfo.behavior[key] = val;
      }
    }
  }
}

module.exports.ProviderInfoDiscovery = ProviderInfoDiscovery;