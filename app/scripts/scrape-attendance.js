const cheerio = require('cheerio');
const async = require('async');
const fs = require('fs');
const path = require('path');
const iconv  = require('iconv-lite');
const models = require("./models");
const request = require('./helper/request');
const { decompose } = require('./helper/utils');

const argv = require("./helper/arguments");
const { WebContentManager } = require('./services/commons/web-content-manager');
const { SeatDeputyMap } = require('./services/commons/seat-deputy-map');
const { parseDate, attendanceDescription } = require('./services/attendance/helper');
const { scrapeSessions, scrapeAttendance } = require('./services/attendance/scraper');
const { loadDistricts } = require('./services/commons/data-loader');

models.sequelize.sync().then(function () {

  function save(sessions, attendances) {
    models.Session.bulkCreate(sessions, { ignoreDuplicates: true })
    .then(function(sessions) {
      console.log(`${sessions.length} sessions saved`);
      models.Attendance.bulkCreate(attendances, { ignoreDuplicates: true })
      .then(function(attendances) {
        console.log(`${attendances.length} attendances saved`);
      });
    });
  }

  function readDeputyReport(webContentManager, baseUrl, url, id, next) {
    // Parse sessions list
    let content = webContentManager.read(baseUrl + url + id);
    let sessions = scrapeSessions(content);
    sessions.forEach(session => {
      // Parse session attendance list
      let match = /pert=(\d+)/.exec(session.url);
      let content = webContentManager.read(baseUrl + session.url)
      session.attendance = scrapeAttendance(content);
      session.attendance.SessionId = session.id = match[1];
    });
    next(null, { id, sessions });
  }

  const sequence = argv();

  const webContentManager = new WebContentManager({
    REPOSITORY: path.join(__dirname, '../data/scraper')
  });

  const seatDeputiesMap = new SeatDeputyMap();
  let baseUrl = 'http://sitl.diputados.gob.mx/LXIII_leg/';
  let url = 'asistencias_diputados_xperiodonplxiii.php?dipt=';

  async.series([loadDistricts.bind(null, models, seatDeputiesMap)], function(err, results) {
      results[0].loadShortReport();

      async.mapSeries(sequence.ids, readDeputyReport.bind(this, webContentManager, baseUrl, url), function(err, deputies) {
        let sessions = [];
        let attendances = [];

        deputies.forEach(deputy => {
          let SeatId = seatDeputiesMap.findSeatFor(deputy).id;
          console.log(`> Deputy #${deputy.id} => ${SeatId}`);
          deputy.sessions.forEach(session => {
            console.log(` - #${session.id} ${session.name} #${session.attendance.length}`)
            sessions.push({ id: session.id, name: session.name });
            session.attendance.forEach(attendance => {
              attendance.SessionId = session.id;
              attendance.SeatId = SeatId;
              attendance.DeputyId = deputy.id
              attendances.push(attendance);
            });
          });
        });

        console.log(`sessions to save ${sessions.length}`);
        console.log(`attendances to save ${attendances.length}`);

        save(sessions, attendances);
      });
  });

});
