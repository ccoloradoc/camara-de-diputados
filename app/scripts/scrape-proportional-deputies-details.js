const cheerio = require('cheerio');
const async = require('async');
const iconv  = require('iconv-lite');
const models = require("./models");
const request = require('./helper/request');
const argv = require("./helper/arguments");
const KeyGenerator = require("./helper/keygenerator");

models.sequelize.sync().then(function () {
  var namesKeyGen = new KeyGenerator();

  var loadNamesHash  = function(callback) {
    models.Name
      .findAll()
      .then(function(names) {
        for(i in names) {
          namesKeyGen.loadPair(names[i].value, names[i].key);
        }
        callback(null, true);
      });
  }

  var bulkCreateDeputies = function(deputies) {
    models.DeputyDetails
      .bulkCreate(deputies, { ignoreDuplicates: true })
      .then(function(deputies) {
        models.Name
          .bulkCreate(namesKeyGen.hashRecord, { ignoreDuplicates: true })
          .then(function(names) {
            console.log(deputies.length + ' diputados have been saved');
            console.log(names.length + ' names have been saved');
          });
      });

  }

  var readDiputado = function(index, next) {
    var d = {
      id: index
    };

    var options =  {
        encoding: null,
        method: 'GET',
        url: `http://www.quienmerepresenta.com/circunscriptions/x/states/x/plurinominals/${d.id}` ,
        noResponseRetries: 5,
        retries: 5
    }
    request(options, function(err, response, html) {
        if(!err){
            var $ = cheerio.load(iconv.decode(new Buffer(html), 'UTF-8'));

            let name = $('.representative-name').text();
            console.log(`>> ${name}`);

            let deputy = {
              id: index + 300, //Offset elected majority
              displayName: name,
              profile: $('.representative-link').attr('href'),
              estudios: $('.representative-academics-txt').text(),
              facebook: 'NA',
              twitter: 'NA',
              hash: namesKeyGen.generateKeyForTerm(name, ' ')
            }

            $('.representative-action-box a').each((index, element) => {
              let link = $(element).attr('href');
              if(link.indexOf('facebook') >= 0)
                deputy.facebook = link;
              if(link.indexOf('twitter') >= 0)
                deputy.twitter = link;
            });

            next(null, deputy);
        } else {
          console.log(`ERROR: ${d.id} with ${err.code} -------------------------------------------------------------------------`);
          next(null, d.id);
        }
    });
  }

  var scrapeDeputies = function(callback) {
    //Reading arguments from=X to=Y
    var sequence = argv();
    async.mapSeries(sequence.ids, readDiputado, function(err, result) {
      bulkCreateDeputies(result);
    });

  }

  async.series([loadNamesHash, scrapeDeputies], function(err, results) {
    console.log('Finished');
  });

});
