const path = require('path');
const async = require('async');
const iconv  = require('iconv-lite');
const request = require('../helper/request');
const argv = require("../helper/arguments");
const { WebContentManager } = require('../services/commons/web-content-manager');

const sequence = argv();

const webContentManager = new WebContentManager({
  REPOSITORY: path.join(__dirname, '../../data/scraper')
});

function downloadDeputy(webContentManager, baseUrl, id, next) {
  let url = baseUrl + id;
  var options =  {
      encoding: null,
      method: 'GET',
      url: url,
      noResponseRetries: 5,
      retries: 5
  };
  request(options, function(err, response, html) {
      if(!err){
          let content = iconv.decode(new Buffer(html), 'ISO-8859-1');
          console.log(`saving ${url}`)
          webContentManager.store(url, content);
          next(null, content);
      } else {
        console.log(`ERROR: ${url} with ${err.code}`);
        next(null, d.id);
      }
  });
}

function downloadProfile(webContentManager, baseUrl, key) {
  downloadDeputy(webContentManager, baseUrl + `Librerias/pp_PerfilLegislador.php?SID=&Referencia=${key}`, '', function(err, content) {
    // Downloading alternate too!!!
    let regex = /Referencia=(\d+)/.exec(content);
    if(regex[1]) {
      console.log(`Found [Librerias/pp_PerfilLegislador.php?SID=&Referencia=${regex[1]}].`);
      downloadDeputy(webContentManager, baseUrl + `Librerias/pp_PerfilLegislador.php?SID=&Referencia=${regex[1]}`, '',
        function(err, content) {});
    }
  });
}

let baseUrl = '';
let url = '';
if(sequence.content === 'deputy') {
  baseUrl = 'http://sitl.diputados.gob.mx/LXIII_leg/';
  url = 'curricula.php?dipt=';
} else if(sequence.content === 'attendance') {
  baseUrl = 'http://sitl.diputados.gob.mx/LXIII_leg/';
  url = 'asistencias_diputados_xperiodonplxiii.php?dipt=';
} else if(sequence.content === 'deputy-details') {
  baseUrl = 'http://www.quienmerepresenta.com/';
  url = 'uninominals/';
} else if(sequence.content === 'deputy-proportional-details') {
  baseUrl = 'http://www.quienmerepresenta.com/';
  url = 'circunscriptions/x/states/x/plurinominals/';
} else if(sequence.content === 'profile') { // Top 101
  baseUrl = 'http://sil.gobernacion.gob.mx/';
  url = 'portal/MkbIndexAjax/getFotos/1/';
} else if(sequence.content === 'profile2'){ // Top 27
   baseUrl = 'http://sil.gobernacion.gob.mx/';
   url = 'portal/MkbIndexAjax/getFotos/2/';
}

try {

  async.mapSeries(sequence.ids, downloadDeputy.bind(this, webContentManager, baseUrl + url), function(err, results) {
    if(sequence.content === 'attendance') {
      // Search for link list on each page
      results.map(content => {
        let match;
        let regex = RegExp('asistencias_por_pernplxiii.+\\d','g');
        while ((match = regex.exec(content)) !== null) {
          console.log(`Found [${match[0]}].`);
          downloadDeputy(webContentManager, baseUrl + match[0], '', function(err, results) {
            // console.log('> Subpages', results)
          });
        }
      });
    } else if(sequence.content === 'profile' || sequence.content === 'profile2') {
      // Get all profile ids from directory content page
      results.map(content => {
        let match;
        let regex = RegExp('(l[0-9]+)','g');
        while ((match = regex.exec(content)) !== null) {
          let key = match[0].replace('l','');
          console.log(`Found [Librerias/pp_PerfilLegislador.php?SID=&Referencia=${key}].`);
          downloadProfile(webContentManager, baseUrl, key);
        }
      });
      /* Missing profiles */
      // http://sil.gobernacion.gob.mx/Librerias/pp_PerfilLegislador.php?Referencia=9218514
      downloadProfile(webContentManager, baseUrl, '9218514');
      // http://sil.gobernacion.gob.mx/Librerias/pp_PerfilLegislador.php?Referencia=9218991
      downloadProfile(webContentManager, baseUrl, '9218991');
      // http://sil.gobernacion.gob.mx/Librerias/pp_PerfilLegislador.php?Referencia=9218301
      downloadProfile(webContentManager, baseUrl, '9218301');
    }
  });

} catch (err) {
  console.log(err);
}
