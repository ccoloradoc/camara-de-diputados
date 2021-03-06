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
  var date = /(\d+)-(\w+)-(\d+)/.exec(stringDate);
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
  // Reading deputies session list
  var readDeputy = function(index, next) {
    let deputy = { id: index };
    let options = {
        encoding: null,
        method: 'GET',
        url: 'http://sitl.diputados.gob.mx/LXIII_leg/iniciativas_diputados_xperiodonplxiii.php?dipt=' + deputy.id,
        noResponseRetries: 5,
        retries: 5
    }
    request(options, function(error, response, html) {
      if(!error){
          var $ = cheerio.load(iconv.decode(new Buffer(html), 'ISO-8859-1'));
          deputy.sessions = [];
          $('table table a.linkVerde').filter(function(index){
            deputy.sessions.push({
              name: $(this).text(),
              url: $(this).attr('href')
            });;
          });
          console.log(`>> Deputy ${index} with ${deputy.sessions.length} sessions`);
          next(null, deputy);
      } else {
        console.log(`ERROR: Deputy ${index} ${error.code} -------------------------------------------------------------------------`);
        next(null, deputy);
      }
    });
  }

  // Reading deputy initiatives per session listing
  var readInitiatives = function(session, callback) {
    let info = decompose(session.url);
    var options =  {
        encoding: null,
        method: 'GET',
        url: 'http://sitl.diputados.gob.mx/LXIII_leg/' + session.url,
        noResponseRetries: 10,
        retries: 10
    }
    request(options, function(error, response, html) {
        if(!error){
          var $ = cheerio.load(iconv.decode(new Buffer(html), 'ISO-8859-1'));
          initiatives = [];

          $('td.Estilo69').each(function(index){
            text = $(this).text().replace(/\s\s+/g, ' ').trim();
            //Parse all columns
            switch(index % 4) {
              case 0:
                initiatives.push({});
                //Intitiative
                //init = /(\d*)(.*)[\.|\,]/.exec(text);
                init = /(\d*)(.*)[\.|\,|\:]/.exec(text);
                if(init != null) {
                    var name = init[2].replace("Adherente", "").replace("Suscribe", "");

                    initiatives[initiatives.length - 1].order = init[1].trim();
                    initiatives[initiatives.length - 1].name = name.substr(0,name.length < 255 ? name.length : 255).toLowerCase();
                    initiatives[initiatives.length - 1].longName = name;
                } else {
                  console.log(" !!No se pudo procesar: <" + text + ">");
                }

                //Relation
                name = /(\w+)\:(.*?)\((.*?)\)/.exec(text);
                if(name != null) {
                    initiatives[initiatives.length - 1].type = name[1].trim();
                    initiatives[initiatives.length - 1].person = name[2].trim();
                    initiatives[initiatives.length - 1].party = name[3];
                }

                break;
              case 1:
                comision = /.*?(\d+-\w+-\d+)(.*)/g.exec(text);
                if(comision != null) {
                  initiatives[initiatives.length - 1].comisionDate = parseDate(comision[1]);
                  initiatives[initiatives.length - 1].comision = comision[2];
                } else {
                  console.log(" !No se pudo procesar: <" + text + ">");
                }
                break;
              case 2:
                initiatives[initiatives.length - 1].sinopsis = text;
                break;
              case 3:
                tra = /^(\w+)[^-\d]*(\d+-\w+-\d+)?.*?\:?.*?(\d+-\w+-\d+)$/g.exec(text);
                if(tra != null) {
                    initiatives[initiatives.length - 1].status = tra[1];
                    initiatives[initiatives.length - 1].statusDate = parseDate(tra[2]);
                    initiatives[initiatives.length - 1].publishedDate = parseDate(tra[3]);
                } else {
                  console.log(" !No se pudo procesar: <" + text + ">");
                }
                break;
            }
          });
          console.log(` Deputy ${info.deputyId} Session ${info.sessionId} with ${initiatives.length} initialives`);
          session.initiatives = initiatives;
          callback(null, session);
        } else {
          console.log(` ERROR: Deputy ${info.deputyId} Session ${info.sessionId} ${error.code}  http://sitl.diputados.gob.mx/LXIII_leg/${session.url}`);
          session.initiatives = [];
          callback(null, session);
        }
    });
  }

  var readDeputiesSessions = function(deputy, callback) {
    async.mapSeries(deputy.sessions, readInitiatives, function(err, sessions) {
      console.log(`Finish processing sessions for deputy ${deputy.id}`);
      deputy.sessions = sessions;
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

  var importSessionInitiatives = function(deputyId, session, callback) {
    sessionId = hashSessions[session.name].id;
    initiatives = [];
    rawInitiativesHash = {};

    //Gather all initiatives
    session.initiatives.forEach(function(initiative) {
      //Adding SessionId
      initiative.SessionId = sessionId;
      initiatives.push(initiative);
      //Storing name for DeputyInitiative record
      if(rawInitiativesHash.hasOwnProperty(initiative.name))
        console.log(' !Deputy ' + deputyId + ' already have ' + initiative.name !== undefined? initiative.name.substr(0, 40) : 'uknown name!' );
      // if(initiative.name.length > 1000)
      //   console.log('----------->>> HUGE NAME' + initiative.name.length)
      rawInitiativesHash[escape(initiative.name)] = initiative;
    });

    //console.log('Pair: ' + deputyId + "/" + sessionId +  " with " + initiatives.length + " initiatives ");

    //Bulk insert initiatives
    models.Initiative
      .bulkCreate(initiatives, { ignoreDuplicates: true })
      .then(function(initiatives) {
        //console.log(' Searching ' + Object.keys(rawInitiativesHash).length + ' initiatives');
        //console.log(Object.keys(rawInitiativesHash));
        //Reading initiatives to load ID
        var unescaped = [];
        var keys = Object.keys(rawInitiativesHash);
        for(var i = 0; i < keys.length; i++) {
          unescaped.push(unescape(keys[i]));
        }
        models.Initiative
          .findAll({ where: { name: { $in: unescaped }, SessionId: sessionId  }})
          .then(function(initiatives) {
            //console.log(' Read ' + initiatives.length + ' initiatives' )

            var deputyInitiatives = [];
            //Generating object deputy initiative
            initiatives.forEach(function(initiative) {
              if(rawInitiativesHash.hasOwnProperty(escape(initiative.name))) {
                deputyInitiatives.push({
                  DeputyId: deputyId,
                  InitiativeId: initiative.id,
                  type: rawInitiativesHash[escape(initiative.name)].type
                });
              } else {
                console.log('Could not find ' + initiative.name)
              }
            });
            //Inserting deputy initiatives
            models.DeputyInitiative
              .bulkCreate(deputyInitiatives, { ignoreDuplicates: true })
              .then(function(deputyInitiatives) {
                callback(null, deputyInitiatives.length);
              });

          });
      });
  }

  var importDeputyInitiatives = function(deputy, callback) {
    var tasks = [];
    deputy.sessions.forEach(function(session) {
      tasks.push(importSessionInitiatives.bind(null, deputy.id, session));
    });

    async.series(tasks, function(err, result) {
      callback(null, result);
    });
  }

  var importInitiatives = function(deputies, callback) {
    tasks = [];
    deputies.map(function(deputy) {
      tasks.push(importDeputyInitiatives.bind(null, deputy));
    });
    async.series(tasks, function(err, initiatives) {
      callback(err, initiatives);
      console.log('Finished all deputies initiatives');
    });
  }

  var sequence = argv();
  async.mapSeries(sequence.ids, readDeputy, function(err, deputies) {

    //Reading initiative details
    async.mapSeries(deputies, readDeputiesSessions, function(error, deputies) {
      //Inserting in database
      async.series({
        savedSessions: saveSessions.bind(null, deputies),
        sessionsHash: hashSessions,
        initiatives: importInitiatives.bind(null, deputies)
      }, function(err, results) {
        console.log(results);
      });
    });
  });

});
