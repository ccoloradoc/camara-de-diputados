const cheerio = require('cheerio');
const async = require('async');
const fs = require('fs');
const iconv  = require('iconv-lite');
const models = require("./models");
const request = require('./helper/request');
const { decompose } = require('./helper/utils');
const argv = require("./helper/arguments");

var parseDate = function(stringDate) {
  //We do not make anything for undefined
  if(stringDate == undefined)
  return '';
  //Parsing
  var date = /(\d+)\s(\w+)\s(\d+)/.exec(stringDate);
  if(date != null) {
    year = date[3];
    month = "enefebmarabrmayjunjulagosepoctnovdic".indexOf(date[2].substr(0,3).toLocaleLowerCase()) / 3 ;
    day = date[1];

    return new Date(year, month, day, 0, 0, 0, 0);
  } else {
    console.log(' !Unable to parse date: ' + stringDate);
    return '';
  }
}

models.sequelize.sync().then(function () {

  var readDeputy = function(index, next) {
    var votations = { id: index, sessions: [] };
    var options =  {
        encoding: null,
        method: 'GET',
        url: 'http://sitl.diputados.gob.mx/LXIII_leg/votaciones_diputados_xperiodonplxiii.php?dipt=' + votations.id
    }
    request(options, function(error, response, html) {
        if(!error){
            var $ = cheerio.load(iconv.decode(new Buffer(html), 'ISO-8859-1'));

            //$('table table table tbody tr td font strong').filter(function(){
            $('table table a.linkVerde').filter(function(index){
              votations.
              sessions.push({
                name: $(this).text().toLocaleUpperCase(),
                url: $(this).attr('href')
              });;
            });
            console.log(`Reading deputy ${index} with ${votations.sessions.length} sessions`);
            next(null, votations);
        }
    });
  }

  var readDecrees = function(session, callback) {
    let info = decompose(session.url);

    var options =  {
        encoding: null,
        method: 'GET',
        url: 'http://sitl.diputados.gob.mx/LXIII_leg/' + session.url
    }
    request(options, function(error, response, html) {
        if(!error){
            var $ = cheerio.load(iconv.decode(new Buffer(html), 'ISO-8859-1'));
            decrees = [];

            $('table tr').each(function(index){
              $(this).find('.TitulosVerde').each(function(i, elem) {
                latestDate = parseDate($(this).text());
                //console.log(latestDate);
                return false;
              });

              $(this).find('.smallVerde').each(function(i, elem) {
                text = $(this).text();
                switch(i){
                  case 1: //Votation Name
                  decrees.push({name: text, votationDate: latestDate});
                  break;
                  case 3: //Deputy Votation
                  decrees[decrees.length -1].votation = text;
                  //console.log(decrees[decrees.length -1])
                  break;
                }
              });

            });
            session.decrees = decrees;
            console.log(` Reading deputy ${info.deputyId} session ${info.sessionId} with ${session.decrees.length} decrees`);
            callback(null, session);
        }
    });

  }

  var readDeputiesSessions = function(deputy, callback) {
    console.log('Deputy:' + deputy.id);
    async.mapSeries(deputy.sessions, readDecrees, function(err, sessions) {
      console.log('Finish processing sessions');
      callback(null, deputy);
    });
  }

  // ---------------------------------------------------------------------------------------
  // -------------------------  SAVING DATA REQUESTED --------------------------------------
  // ---------------------------------------------------------------------------------------


  var hashSessions = {};

  var saveSessions = function(deputies, callback) {
    async.map(deputies, function(deputy, callback) {
      callback(null, deputy.sessions);
    }, function(err, sessions) {
      var bulkSessions = [];
      sessions.forEach(function(session) { bulkSessions = bulkSessions.concat(session); })

      models.Session
        .bulkCreate(bulkSessions, { ignoreDuplicates: true })
        .then(function(sessions) {
          callback(null, sessions.length);
        });
    });
  }

  var hashSessions = function(callback) {
    models.Session
      .findAll()
      .then(function(sessions) {
        sessions.forEach(function(session) {
          hashSessions[session.name] = session.get({plain: true});
        });
        callback(null, Object.keys(hashSessions).length);
      });
  }

  var importSessionVotations = function(deputyId, session, callback) {
    sessionId = hashSessions[session.name].id;
    decrees = [];
    rawDecreeHash = {};

    //Gather all decrees
    session.decrees.forEach(function(decree) {
      //Adding SessionId
      decree.SessionId = sessionId;
      decrees.push(decree);
      //Storing name for DeputyInitiative record
      if(rawDecreeHash.hasOwnProperty(decree.name))
        console.log(' !Deputy ' + deputyId + ' already have ' + decree.name.substr(0, 40) );

      rawDecreeHash[decree.name] = decree;
    });

    console.log('Pair: ' + deputyId + "/" + sessionId +  " with " + decrees.length + " decrees ");

    //Bulk insert decrees
    models.Decree
      .bulkCreate(decrees, { ignoreDuplicates: true })
      .then(function(decrees) {
        console.log(' Searching ' + Object.keys(rawDecreeHash).length + ' decrees');
        //console.log(Object.keys(rawDecreeHash));
        //Reading decrees to load ID
        models.Decree
          .findAll({ where: { name: { $in: Object.keys(rawDecreeHash) }, SessionId: sessionId  }})
          .then(function(decrees) {
            console.log(' Read ' + decrees.length + ' decrees' )

            var deputyVotes = [];
            //Generating object deputy decree
            decrees.forEach(function(decree) {
              deputyVotes.push({
                DeputyId: deputyId,
                DecreeId: decree.id,
                vote: rawDecreeHash[decree.name].votation
              });
            });

            //Inserting deputy decrees
            models.Vote
              .bulkCreate(deputyVotes, { ignoreDuplicates: true })
              .then(function(deputyVotes) {
                callback(null, deputyVotes.length);
              });
          });
      });
  }

  var importDeputyVotations = function(deputy, callback) {
    var tasks = [];
    deputy.sessions.forEach(function(session) {
      tasks.push(importSessionVotations.bind(null, deputy.id, session));
    });

    async.series(tasks, function(err, result) {
      callback(null, result);
    });
  }

  var importVotations = function(deputies, callback) {
    tasks = [];
    deputies.map(function(deputy) {
      tasks.push(importDeputyVotations.bind(null, deputy));
    });
    async.series(tasks, function(err, decrees) {
      callback(err, decrees);
      console.log('Finished all deputies decrees');
    });
  }

  var sequence = argv();
  async.mapSeries(sequence.ids, readDeputy, function(err, deputies) {
  // //Reading votations from 3 deputy
  // async.times(3, readDeputy , function(err, deputies) {
      //Reading session details
      async.map(deputies, readDeputiesSessions, function(error, deputies) {
        console.log('Finish processing diputados');

        //Inserting in database
        async.series({
          savedSessions: saveSessions.bind(null, deputies),
          sessionsHash: hashSessions,
          votations: importVotations.bind(null, deputies)
        }, function(err, results) {
          console.log(results);
        });

        //Storing in file for inspection
        // fs.writeFile('./data/json/votations_' + sequence.from + '_' + sequence.to + '.json', JSON.stringify(deputies) , 'utf-8');
      });
  });


  // fs.readFile('./downloads/json/votations.json', 'utf8', function (err,data) {
  //   if (err)
  //     return console.log(err);
  //
  //   deputies = JSON.parse(data);
  //
  //   async.series({
  //     savedSessions: saveSessions.bind(null, deputies),
  //     sessionsHash: hashSessions,
  //     votations: importVotations.bind(null, deputies)
  //   }, function(err, results) {
  //     console.log(results);
  //   });
  // });

});
