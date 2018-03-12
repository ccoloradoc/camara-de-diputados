const path = require('path');
const async = require('async');
const models = require("./models");
const argv = require("./helper/arguments");
const { WebContentManager } = require('./services/commons/web-content-manager');
const { SeatDeputyMap } = require('./services/commons/seat-deputy-map');
const { loadNamesHash } = require('./services/deputies/loaders');
const { loadDistricts } = require('./services/commons/data-loader');
const { parseDeputy } = require('./services/deputies/scraper');

const sequence = argv();

const webContentManager = new WebContentManager({
  REPOSITORY: path.join(__dirname, '../data/scraper')
});

models.sequelize.sync().then(function () {

  function save(seats, deputies, namesKeyGen) {
    models.Seat
    .bulkCreate(seats, { ignoreDuplicates: true })
    .then(function(seats) {
      models.Deputy
        .bulkCreate(deputies, { ignoreDuplicates: true })
        .then(function(deputies) {
          models.Name
            .bulkCreate(namesKeyGen.hashRecord, { ignoreDuplicates: true })
            .then(function(names) {
              console.log(seats.length + ' seats have been saved');
              console.log(deputies.length + ' diputados have been saved');
              console.log(names.length + ' names have been saved');
            });
        });
    });
  }

  function readDeputy(namesKeyGen, scraperManager, index, next) {
    let url = 'http://sitl.diputados.gob.mx/LXIII_leg/curricula.php?dipt=' + index;
    let content = scraperManager.read(url);
    let result = parseDeputy(index, content, namesKeyGen);
    // console.log(result);
    next(null, result);
  }


  const seatDeputiesMap = new SeatDeputyMap();

  async.series([loadNamesHash.bind(null, models), loadDistricts.bind(null, models, seatDeputiesMap)],
    function(err, results) {
      const namesKeyGen = results[0];
      // seatDeputiesMap.loadReport();

      async.mapSeries(sequence.ids, readDeputy.bind(this, namesKeyGen, webContentManager), function(err, resultSet) {
        resultSet.forEach(set => {
          seatDeputiesMap.map(set.seat, set.deputy);
        });
        seatDeputiesMap.report();
        save(seatDeputiesMap.seats, seatDeputiesMap.deputies, namesKeyGen);
      });
  });

});
