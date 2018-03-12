const cheerio = require('cheerio');
const { normalize, slugify } = require("../../helper/utils");
const { cleanDeputyName, identifyParty } = require("./helper");

function parseDeputy(id, content, namesKeyGen) {
  let seat = {}, d = { id };
  let $ = cheerio.load(content);

  $('table table table tbody tr td strong').filter(function(index){
      //Take value
      value = $(this).text().trim();
      //Evaluate destiny field
      switch (index) {
        case 0: param = 'displayName'; break;
        //Seat
        case 1: param = 'type'; break;
        case 2: param = 'state'; break;
        case 3: param = 'area'; break;
        //Deputy
        case 4: param = 'curul'; break;
        case 5: param = 'email'; break;
        case 6: param = 'birthdate'; break;
        case 7: param = 'alternate'; break;
      }

      if(index == 1 || index == 2 || index == 3) { // Seat information
        seat[param] = value;
      } else if(index == 0 || index == 7) { // Deputy information
        d[param] = cleanDeputyName(value);
        hash = namesKeyGen.generateKeyForTerm(d[param], ' ');
        if(index == 0) {
          d['hash'] = hash;
          d['slug'] = slugify(d[param]);
        } else {
          d['altHash'] = hash;
        }
      } else {
        d[param] = decodeURIComponent(value);
      }

  });

  $('table tr td img').filter(function(index){
      src = $(this).attr('src');
      switch (index) {
        case 1:
          d['picture'] = src;
          break;
        case 2:
          regex = /.*\/(\w+)\..*/.exec(src);
          d['party'] = identifyParty(regex != null? regex[1]:'Uknown');
          break;
      }
  });

  console.log('>> ' + d.id + ' - ' + d.displayName + ' (' + seat.type + ' '  + seat.state + ' Dto.' + seat.area + ')');

  return { seat, deputy: d};
}

function parseProfile(profileName, content, namesKeyGen) {
  let $ = cheerio.load(content);
  let regex = /(\d+)/.exec(profileName);
  let profile = {
    profileNumber: regex ? regex[1] : 0
  };

  $('.tddatosazul').filter(function(index){
      //Take value
      let value = $(this).text().trim();
      let row = $(this).prev().text().trim();
      if(row === 'Nombre:') {
        let name = cheerio.load($(this).html().split('<br>')[1]).text().split(', ');
        profile['displayName'] = name[1] + ' ' + name[0];
        profile['slug'] = slugify(profile['displayName']);
        profile['hash'] = namesKeyGen.generateKeyForTerm(profile['displayName'], ' ');
      } else if(row === 'Estatus:') {
        profile['status'] = value;
      } else if(row === 'Partido:') {
        profile['party'] = value;
      } else if(row === 'Nacimiento:') {
        let text = cheerio.load($(this).html().split('<br>')[0]).text();
        let regex = /Fecha: (\d+\/\d+\/\d+|N\/A)/.exec(text);
        profile['birth'] = regex != null? regex[1] : 'NA';
      } else if(row === 'Principio de elección:') {
        profile['type'] = value;
      } else if(row === 'Zona:') {
        let zone = $(this).html().split('<br>');
        profile['state'] = cheerio.load(zone[0]).text().replace('Entidad: ', '');
        profile['district'] = cheerio.load(zone[1]).text();
      } else if(row === 'Toma de protesta:') {
        profile['startDate'] = value;
      } else if(row === 'Ubicación en la cámara:') {
        profile['building'] = value;
      } else if(row === 'Correo  electrónico:') {
        profile['email'] = value;
      } else if(row === 'Teléfono en cámara:') {
        profile['phone'] = value;
      } else if(row === 'Suplente:' || row === 'Suplente de:') {
        let regex = /(\d+)/.exec($(this).html())
        if(value.indexOf(',') > 0) {
          altname = value.split(', ');
          profile['alternate'] = altname[1] + ' ' + altname[0];
        } else {
          profile['alternate'] = value.replace('Diputado','').replace('Diputada','').trim();
        }

        profile['alternateProfile'] = regex ? regex[1] : 'NA'

      } else if(row === 'Último grado de estudios:') {
        profile['studies'] = value;
      } else if(row === 'Preparación académica:') {
        profile['academics'] = value;
      }  else if(row === 'Experiencia legislativa:') {
        profile['experience'] = value;
      }
  });

  return profile;
}
exports.parseDeputy = parseDeputy;
exports.parseProfile = parseProfile;
