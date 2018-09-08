const path = require('path');
const async = require('async');
const models = require("./models");
const argv = require("./helper/arguments");
const { WebContentManager } = require('./services/commons/web-content-manager');
const { SeatDeputyMap } = require('./services/commons/seat-deputy-map');
const { loadNamesHash } = require('./services/deputies/loaders');
const { loadDistricts } = require('./services/commons/data-loader');
const { parseProfile } = require('./services/deputies/scraper');

const sequence = argv();

const webContentManager = new WebContentManager({
  REPOSITORY: path.join(__dirname, '../data/scraper')
});

models.sequelize.sync().then(function () {

  async.series([loadNamesHash.bind(null, models)], function(err, results) {
      const namesKeyGen = results[0];
      const profiles = [];
      let url = 'http/sil-gobernacion-gob-mx/librerias/pp-perfillegislador-php/';
      let elements = webContentManager.getFiles(url);
      elements.forEach(element => {
        let content = webContentManager.read(url + element.replace('.html',''));
        let deputy = parseProfile(element, content, namesKeyGen);
        profiles.push(deputy);
        console.log(`> ${deputy.profileNumber} ${deputy.displayName} ${deputy.email}`);
      });

      console.log(` > ${profiles.length} to be saved`)

      models.ProfileStg
        .bulkCreate(profiles, { ignoreDuplicates: true })
        .then(function(profiles) {
          console.log(`> ${profiles.length} profiles have been saved`);
        });

  });

});
