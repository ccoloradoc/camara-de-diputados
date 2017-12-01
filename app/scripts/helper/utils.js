const AdmZip = require('adm-zip');
const csv = require('csvtojson');

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = {
  normalize: function(r) {
    r = r.replace(new RegExp(/[àáâãäå]/g),"a");
    r = r.replace(new RegExp(/[èéêë]/g),"e");
    r = r.replace(new RegExp(/[ìíîï]/g),"i");
    r = r.replace(new RegExp(/[òóôõö]/g),"o");
    r = r.replace(new RegExp(/[ùúûü]/g),"u");
    return r;
  },
  unzip: function(file, destination) {
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
  },
  csvToJson: function(file) {
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
}

exports.unzip = exports.default.unzip;
exports.csvToJson = exports.default.csvToJson;
exports.normalize = exports.default.normalize;
