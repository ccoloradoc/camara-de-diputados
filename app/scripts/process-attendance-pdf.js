const fs = require('fs');
const PDFParser = require("pdf2json");
const async = require('async');
const models = require("./models");
const request = require('./helper/request');
const KeyGenerator = require("./helper/keygenerator");

models.sequelize.sync().then(function () {

    var parseFileDate = function(stringDate) {
      if(stringDate.length == 8) { //25022016
        return new Date(stringDate.slice(4,stringDate.length), parseInt(stringDate.slice(2,4)) - 1, stringDate.slice(0,2), 0, 0, 0, 0);
      } else if(stringDate.length == 6) { //250216
        return new Date('20' + stringDate.slice(4,stringDate.length), parseInt(stringDate.slice(2,4)) - 1, stringDate.slice(0,2), 0, 0, 0, 0);
      } else if(stringDate.length == 10) { //25|02|2016
        date = /(\d+)\|+(\w+)\|+(\d+)/.exec(stringDate);
        if(date != undefined) {
          return new Date(date[3], parseInt(date[2]) - 1, date[1], 0, 0, 0, 0);
        }
      }
    }

    var retriveDate = function(stringDate) {
      //Remove dayname and "de"
      stringDate = stringDate.substr(stringDate.indexOf(',') + 1, stringDate.length).replace(/de/g, '').trim().toLocaleLowerCase();
      //Splice
      day = stringDate.slice(0,2);
      month = stringDate.slice(2,stringDate.length - 4).replace(/ +/g, '').slice(0,3);
      year = stringDate.slice(stringDate.length - 4,stringDate.length);
      //Translate month
      month = "enefebmarabrmayjunjulagosepoctnovdic".indexOf(month) / 3 ;
      //console.log(stringDate + " is " + new Date(year, month, day, 0, 0, 0, 0));
      return new Date(year, month, day, 0, 0, 0, 0);
    }

    var processJSON = function(pdf, date) {
      var fileDate = '';
      attendance = [];

      //Iterating Pages
      for(i in pdf.formImage.Pages) {
        page = pdf.formImage.Pages[i];
        row = []; rowY = 0;
        prevX = 0;
        //Iterating Page Content
        for(j in page.Texts) {
          text = page.Texts[j];

          //If text is close to previous, they are in the same row
          if(Math.abs(text.y - rowY) < 0.15){
            row.push(decodeURI(text.R[0].T));
          } else {
              //End of the row
              if(row.length == 3) {
                last = row[row.length-1];
                if(last === 'ASISTENCIA'  || last === 'JUSTIFICADA' ||
                    last === 'INASISTENCIA' || last === 'CÉDULA' ||
                    last === 'OFICIAL COMISIÓN' || last === 'PERMISO MESA DIRECTIVA' ) {
                  if(row[1].trim() == 'Etcheverry Aranda Maricela Emilse') {
                    row[1] = 'Azul Etcheverry Aranda'; // Name changes somehow!!!
                  }
                  console.log(`  -  ${row[1]} - ${row[2]}`);
                  attendance.push({
                    name: row[1],
                    hash: namesKeyGen.generateKeyForTerm(row[1], ' '),
                    attendance: row[2],
                    attendanceDate: fileDate || date
                  });
                } else {
                  console.log(`  x ${row}`)
                }
              } else if(fileDate === '' && row.join(' ').lastIndexOf('2016') >= 0) {
                fileDate = retriveDate(decodeURIComponent(row.join(' ')));
              } else {
                let str = row.join('').replace(/\s+/g, '');
                let names = str.match(/([A-Z][^A-Z]+)/g);
                let status = str.match(/(ASISTENCIA|JUSTIFICADA|INASISTENCIA|CÉDULA|OFICIALCOMISIÓN|PERMISOMESADIRECTIVA)/g);
                if(names != null && names.length > 2 && status) {
                  let name = names.join(' ').replace(' CÉ','');
                  console.log(`  - ${name} - ${status} `);
                  attendance.push({
                    name: name,
                    hash: namesKeyGen.generateKeyForTerm(names.join(' '), ' '),
                    attendance: status,
                    attendanceDate: fileDate || date
                  });
                } else {
                  console.log(`  x ${str}`)
                }
              }

              row = [];
              row.push(decodeURI(text.R[0].T));
          }
          rowY = text.y;
        }
      }

      return attendance;
    }

    var namesKeyGen = new KeyGenerator();

    var loadNamesHash  = function(callback) {
      models.Name
        .findAll()
        .then(function(names) {
          for(i in names) {
            //nameHash[names[i].name] = names[i].hash;
            namesKeyGen.loadPair(names[i].value, names[i].key);
          }
          callback(null, true);
        });
    }

    var parseFile = function(file, callback) {
      //Convert PDF to JSON
      pdfParser = new PDFParser();
      // Handle errors
      pdfParser.on("pdfParser_dataError", function(errData) {
        console.log('Error', errData);
        file.updateAttributes({ step: 999 });
        console.error(errData.parserError)
      });

      /// Handle data
      pdfParser.on("pdfParser_dataReady", function(pdf) {
        console.log(`> Parsing file ${file.name}`)
        var date = parseFileDate(file.name);
        var json = processJSON(pdf, date);
        console.log(`> File [${file.name}] ${json.length} elements for ${date}`);
        if(json.length > 0)
          file.updateAttributes({ step: 2 });
        else
          file.updateAttributes({ step: 666 });
        callback(null, json);
      });

      // Kick conversion
      pdfParser.loadPDF("./data/pdf/" + file.name + ".pdf");
    }

    var processFiles = function(callback) {
      models.AttendanceFile
        .findAll({ where: { step: 1 }}) // Find All downloaded files
        .then(function(files) {
          async.mapSeries(files, parseFile, function(err, result) {
              var bulkAttendance = [];
              for(i in result) {
                bulkAttendance = bulkAttendance.concat(result[i]);
              }
              console.log(` Attempt saving: ${bulkAttendance.length}`);
              while(bulkAttendance.length){
                console.log(` left ${bulkAttendance.length}`)
                batch = bulkAttendance.slice(0, bulkAttendance.length > 1000 ? 1000 : bulkAttendance.length);
                bulkAttendance = bulkAttendance.slice(bulkAttendance.length > 1000 ? 1000 : bulkAttendance.length);

                models.AttendanceStg
                  .bulkCreate(batch, { ignoreDuplicates: true });
                  // .then(function(attendanceStg) {
                  //   //console.log(` ${attendanceStg.length} attendance have been saved`);
                  // });
              }

              models.Name
              .bulkCreate(namesKeyGen.hashRecord, { ignoreDuplicates: true })
              .then(function(names) {
                console.log(` ${names.length} names have been saved`);
              });

          });
        });
    }

    async.series([loadNamesHash, processFiles], function(err, results) {
      console.log(namesRecords);
    });

});
