/*
  Concentrado General de Secciones Electorales
  source: http://cartografia.ife.org.mx/sige7/?infogeo=CGS
  http://cartografia.ife.org.mx/sige7/views/infogeo/down_cgs.php

  Rangos de Secciones por Municipio
  Source: http://cartografia.ife.org.mx/sige7/?infogeo=RSM
  http://cartografia.ife.org.mx/sige7/views/infogeo/down_rgs.php
*/

const models = require("./models");
const { csvToJson, unzip } = require("./helper/utils");

/*
  Import states and areas for plurinominal
*/
var importStates = function() {
  return new Promise((resolve, reject) => {
    let file = "./data/circ/states-circ.csv";
    console.log(`>> Importing: ${file}`)
    csvToJson(file).then((items) => {
      models.State
        .bulkCreate(items, { ignoreDuplicates: true})
        .then(() => {
          return models.State.findAll({ raw: true });
        })
        .then((states) => {
          console.log(`Imported ${states.length} states`);
          resolve(states);
        });
    }, (err) => {
      reject(err);
    });
  });
}

/*
  Import municipalities and indicate if they belog to multiple districts
*/
var importMunicipality = function() {
  return new Promise((resolve, reject) => {
    let file = "./data/cgs/cgs.csv";
    let hash = {};
    let municipalities = [];
    console.log(`>> Importing: ${file}`);
    csvToJson(file).then((items) => {
      // Hash the municipalities
      items.forEach((item) => {
        if( item.cve_mpio !== '') {
          let key = `e${item.cve_edo}m${item.cve_mpio}`;
          if(!hash.hasOwnProperty(key)) {
            hash[key] = {
              mid: item.cve_mpio,
              name: item.mpio,
              district: parseInt(item.dto),
              multiple: 0,
              StateId: parseInt(item.cve_edo)
            };
          } else {
            hash[key].multiple ++;
          }
        }
      });

      // Translate hash to stack
      for (var key in hash) {
         if (hash.hasOwnProperty(key)) {
           municipalities.push(hash[key])
         }
      }

      // Bulk create municipalities
      models.Municipality
        .bulkCreate(municipalities, { ignoreDuplicates: true})
        .then(() => {
          return models.Municipality.findAll({ raw: true });
        })
        .then((municipalities) => {
          resolve(municipalities);
        });
    }, (err) => {
      reject(err);
    });
  });
}

/*
  Import district sectional ranges
*/
var importDistrictsRanges = function() {
  return new Promise((resolve, reject) => {
    let ranges = [];
    let file = "./data/rango/rango.csv";
    console.log(`>> Importing: ${file}`);
    // Parse CSV
    csvToJson(file).then((items) => {
      // Translate
      items.forEach((item) => {
        ranges.push({
          //"cve_edo","estado","dto","cve_mpio","mpio","inicio","fin","total_secciones"
          sid: item.cve_edo,
          mid: item.cve_mpio,
          district: item.dto,
          start: item.inicio,
          end: item.fin,
          total: item.total_secciones
        })
      });

      // Bulk insert
      models.Range
        .bulkCreate(ranges, { ignoreDuplicates: true})
        .then(() => {
          return models.Range.findAll({ raw: true });
        })
        .then((ranges) => {
          resolve(ranges);
        });
    }, (err) => {
      reject(err);
    });
  });
}

models.sequelize.sync().then(function () {
  Promise.all([
    unzip("./data/cgs.zip", "./data/cgs"),
    unzip("./data/rango.zip", "./data/rango"),
    unzip("./data/circ.zip", "./data/circ")
  ]).then(() => {
    Promise.all([
      importStates(),
      importMunicipality(),
      importDistrictsRanges()
    ]).then((result) => {
      console.log('Finished...');
    });
  });
});
