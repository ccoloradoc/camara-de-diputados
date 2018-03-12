const AdmZip = require('adm-zip');
const csv = require('csvtojson');

Object.defineProperty(exports, "__esModule", {
  value: true
});

function normalize(r) {
  r = r.replace(new RegExp(/[àáâãäå]/g),"a");
  r = r.replace(new RegExp(/[èéêë]/g),"e");
  r = r.replace(new RegExp(/[ìíîï]/g),"i");
  r = r.replace(new RegExp(/[òóôõö]/g),"o");
  r = r.replace(new RegExp(/[ùúûü]/g),"u");
  r = r.replace(new RegExp(/[ñ]/g),"n");
  return r;
}

function slugify(term) {
  return normalize(term.toLowerCase().replace(/ /g, '-'));
}

function decompose(url) {
  let regex = /iddipt=(\d+).pert=(\d+)/.exec(url);
  return {
    deputyId: regex[1],
    sessionId: regex[2]
  };
}

function unzip(file, destination) {
  return new Promise(function(resolve, reject) {
    var zip = new AdmZip(file);
    try {
      zip.extractAllToAsync(destination, true, () => {
        resolve(true);
      });
    } catch(err) {
      reject(err);
    }
  });
}

function csvToJson(file) {
  return new Promise((resolve, reject) => {
    let items = [];
    try {
      csv()
      .fromFile(file)
      .on('json', (item) => {
        items.push(item);
      })
      .on('done', () => {
        resolve(items);
      });
    } catch(err) {
      reject(err);
    }
  });
}

exports.default = {};

exports.unzip = exports.default.unzip = unzip;
exports.csvToJson = exports.default.csvToJson = csvToJson;
exports.normalize = exports.default.normalize = normalize;
exports.slugify = exports.default.slugify = slugify;
exports.decompose = exports.default.decompose = decompose;
