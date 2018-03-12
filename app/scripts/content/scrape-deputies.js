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

function downloadDeputy(webContentManager, id, next) {
  let url = 'http://sitl.diputados.gob.mx/LXIII_leg/curricula.php?dipt=' + id;
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
          webContentManager.store(url, content);
          next(null, url);
      } else {
        console.log(`ERROR: ${url} with ${err.code}`);
        next(null, d.id);
      }
  });
}

async.mapSeries(sequence.ids, downloadDeputy.bind(this, webContentManager), function(err, results) {
  console.log(results);
});
