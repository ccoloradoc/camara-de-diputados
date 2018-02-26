const async = require('async');
const axios = require('axios');
const fs = require('fs');
const models = require("./models");
const STORAGE_PATH = './data/storage';

let downloadDeputy = function(deputy, next) {
  let path = `http://sitl.diputados.gob.mx/LXIII_leg/${deputy.picture}`;
  let fileName = `${deputy.slug}.jpg`;
  console.log(`>> ${path}`);
  axios.get(path, { responseType: 'arraybuffer' })
    .then((response) => {
      const buffer = new Buffer(response.data, 'binary');
      fs.writeFile(STORAGE_PATH + '/' + fileName, buffer, 'binary', function(err) {
        if(err) console.log(err);
        console.log(`   ${fileName}`);
        next(null, fileName);
      });
    });
}

// NODE_ENV=production node bin/download-pictures.js
models.sequelize.sync().then(function () {
  let queryString = 'select picture, slug from Deputies where slug is not null';

  models.sequelize
    .query(queryString, {
      type: models.sequelize.QueryTypes.SELECT
    })
    .then(function(deputies) {
      async.mapSeries(deputies, downloadDeputy, function(err, bulkDeputies) {
        console.log(bulkDeputies);
      });
    }, function(err) {
      console.log(err);
      renderError(res, `No se pudo encontrar informacion`);
    });

});
