const cheerio = require('cheerio');
const async = require('async');
const fs = require('fs');
const request = require('./helper/request');
const models = require("./models");

models.sequelize.sync().then(function () {

  var readAttendance = function(mOffset, next) {
    var files = [];
    var offset = mOffset == 0 ? '' : '/(offset)/' + (mOffset * 10);
    var url = 'http://www5.diputados.gob.mx/index.php/camara/Asistencias-LXIII-Legislatura/Asistencias' + offset;
    request(url, function(error, response, html) {
        if(!error){
            var $ = cheerio.load(html);

            $('.class-file .attribute-file a').filter(function(index){
                //console.log($(this).text() + " - " + $(this).attr('href'));
                files.push({
                  name: $(this).text().trim(),
                  path: $(this).attr('href'),
                  step: 0,
                  type: 'ATTENDANCE'
                });
            });

            next(null, files);
        }
    });
  }

  //Execute nineten times (we validate that pages exist)
  async.times(19, readAttendance , function(err, result) {
      var attendanceFiles = [];
      for(i in result) {
        attendanceFiles = attendanceFiles.concat(result[i]);
      }
      console.log('Files identified: ', attendanceFiles.length);

      models.AttendanceFile
        .bulkCreate(attendanceFiles, { ignoreDuplicates: true })
        .then(function(files) {
          files = files.map(function(file){ return file.get({plain:true}) });
          console.log(`Saved ${files.length}`);
        });
  });

});
