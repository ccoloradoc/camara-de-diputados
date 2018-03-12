const request = require('request');
const async = require('async');
const fs = require('fs');
const path = require('path');
const models = require("./models");

var downloadFile = function(file, callback) {
  request("http://www5.diputados.gob.mx" + file.path)
    .pipe(fs.createWriteStream(path.join(__dirname, "../data/pdf/" + file.name + ".pdf")))
    .on('finish', function () {
      console.log('File downloaded: ' + file.name);
      file.updateAttributes({ step: 1 });
      callback(null, file.name);
    })
    .on('error', function(error) {
      console.log('Error downloading: ' + file.name);
      callback(error, false);
    });
}

var downloadFiles = function(files) {
  //Download every file
  async.eachSeries(files, downloadFile, function(err, result) {
    console.log('Files processed successfully', result);
  });
}

models.sequelize.sync().then(function () {

  models.AttendanceFile
    .findAll({ where: { step: 0 } }) //Find all scrape files
    .then(downloadFiles);

});
