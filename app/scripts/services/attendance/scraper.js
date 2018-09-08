const cheerio = require('cheerio');
const iconv  = require('iconv-lite');
const { parseDate, attendanceDescription } = require('./helper');

function scrapeSessions(content) {
  let $ = cheerio.load(iconv.decode(new Buffer(content), 'UTF-8'));
  let sessions = [];

  $('table table a.linkVerde').filter(function(index){
    sessions.push({
      name: $(this).text().trim(),
      url: $(this).attr('href')
    });
  });

  return sessions;
}

function scrapeAttendance(content) {
  var $ = cheerio.load(iconv.decode(new Buffer(content), 'UTF-8'));
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
          attendanceDate: parseDate(regex[1] + ' ' + date),
          attendance: regex[2],
          description: attendanceDescription(regex[2])
        })
      }
    })
  });

  return attendance;
}

exports.scrapeSessions = scrapeSessions;
exports.scrapeAttendance = scrapeAttendance;
