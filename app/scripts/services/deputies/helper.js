
function cleanDeputyName(name) {
  //Remove unecesary spaces
  name = name.replace(/  +/g, ' ');
  //Remove 'protetesta ..'
  name = name.replace('(no rindieron protesta)', '').trim();
  //remove Licence advice
  name = name.replace('(LICENCIA)','').trim();
  name = name.replace('(DECESO)','').trim();
  //Remove 'Dip.''
  name = name.substr(name.indexOf('.') + 1, name.lenght).trim();
  return name;
}

function identifyParty(party) {
  if(party == 'pri01') {
    party = 'pri';
  } else if(party == 'pan') {
    party = 'pan';
  } else if(party == 'logvrd') {
    party = 'pve';
  } else if(party == 'prd01') {
    party = 'prd';
  } else if(party == 'LogoMorena') {
    party = 'morena';
  } else if(party == 'logo_movimiento_ciudadano') {
    party = 'movimiento ciudadano';
  } else if(party == 'panal') {
    party = 'panal';
  } else if(party == 'independiente') {
    party = 'independiente';
  } else if(party == 'encuentro') {
    party = 'encuentro';
  } else if(party == 'logo_SP') {
    party = 'sp';
  }
  return party;
}

exports.cleanDeputyName = cleanDeputyName;
exports.identifyParty = identifyParty;
