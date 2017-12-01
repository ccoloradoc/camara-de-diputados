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
  var date = /(\d+)\s+(\w+)\s+(\d+)/.exec(stringDate.toLocaleLowerCase());
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

  // Reads the list of sessions with a link to attendace
  var readDeputy = function(index, next) {
    var attendance = { id: index, sessions: [] };
    var options =  {
        encoding: null,
        method: 'GET',
        url: 'http://sitl.diputados.gob.mx/LXIII_leg/asistencias_diputados_xperiodonplxiii.php?dipt=' + attendance.id,
        noResponseRetries: 5,
        retries: 5
    }
    request(options, function(error, response, html) {
        if(!error){
            var $ = cheerio.load(iconv.decode(new Buffer(html), 'ISO-8859-1'));

            //$('table table table tbody tr td font strong').filter(function(){
            $('table table a.linkVerde').filter(function(index){
              attendance.
              sessions.push({
                name: $(this).text().trim(),
                url: $(this).attr('href')
              });
            });

            next(null, attendance);
        } else {
          console.log(`ERROR: ${attendance.id} with ${error.code} -------------------------------------------------------------------------`);
          next(null, attendance.id);
        }
    });
  }

  // Access attenance for a deputy/session
  var readInitiatives = function(deputyId, session, callback) {
    let info = decompose(session.url);
    var options =  {
        encoding: null,
        method: 'GET',
        url: 'http://sitl.diputados.gob.mx/LXIII_leg/' + session.url,
        noResponseRetries: 5,
        retries: 5
    }
    request(options, function(error, response, html) {
        if(!error){
            var $ = cheerio.load(iconv.decode(new Buffer(html), 'ISO-8859-1'));
            attendance = [];

            $('table table table table').each(function(index) {
              var date =  '';
              $(this).find('span.TitulosVerde').each(function(index) {
                regex = /([A-Z]+)([0-9]+)/.exec($(this).text());
                date = $(this).text().trim();
              })

              $(this).find('div font').each(function(index) {
                regex = /([0-9]+)([A-Z]+)/.exec($(this).text());
                if(regex != null) {
                  attendance.push({
                    DeputyId: deputyId,
                    attendanceDate: parseDate(regex[1] + ' ' + date),
                    attendance: regex[2],
                    SessionId: session.id
                  })
                }
              })
            });

            console.log(`Request deputy: ${info.deputyId} season ${info.sessionId} attendance ${attendance.length}`);
            session.attendance = attendance;
            callback(null, session);
        } else {
          console.log(`ERROR: Deputy ${info.deputyId} session ${session.id} with ${error.code} -------------------------------------------------------------------------`);
          callback(null, session);
        }
    });

  }

  var readDeputiesSessions = function(deputy, callback) {
    async.map(deputy.sessions, readInitiatives.bind(null, deputy.id), function(err, sessions) {
      let missingSeasons = sessions.filter((session) => !session.attendance);
      if(missingSeasons.length) {
        console.log(`Error ${missingSeasons.length} sessions could not been parsed!!! ----------------------------`);
      } else {
        // All seasons where pull out
        deputy.sessions = sessions;
        console.log(`Finish processing deputy ${deputy.id} sessions #${deputy.sessions.length}`);
        callback(null, deputy);
      }

    });
  }

  // ---------------------------------------------------------------------------------------
  // -------------------------  SAVING DATA REQUESTED --------------------------------------
  // ---------------------------------------------------------------------------------------


  var importSessionInitiatives = function(deputyId, session, callback) {
    //Bulk insert initiatives
    models.Attendance
      .bulkCreate(session.attendance, { ignoreDuplicates: true })
      .then(function(attendances) {
        // console.log(' Saved ' + attendances.length + ' attendance');
        callback(null, attendances.length);
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
        // Inserting in database
        async.series({
          initiatives: importInitiatives.bind(null, deputies)
        }, function(err, results) {
          console.log('attendances saved ', results);
        });
      });
  });
});
