const cheerio = require('cheerio');
const async = require('async');
const iconv  = require('iconv-lite');
const models = require("./models");
const request = require('./helper/request');
const argv = require("./helper/arguments");
const KeyGenerator = require("./helper/keygenerator");
const HashMap = require("./helper/hashmap");
const { normalize } = require("./helper/utils");

var cleanDeputyName = function(name) {
  //Remove unecesary spaces
  name = name.replace(/  +/g, ' ');
  //Remove 'protetesta ..'
  name = name.replace('(no rindieron protesta)', '').trim();
  //remove Licence advice
  name = name.replace('(LICENCIA)','').trim();
  name = name.replace('(DECESO)','').trim();
  //Remove 'Dip.''
  name = name.substr(name.indexOf('.') + 1, name.lenght).trim();
  return name;
}

var identifyParty = function(party) {
  if(party == 'pri01') {
    party = 'pri';
  } else if(party == 'pan') {
    party = 'pan';
  } else if(party == 'logvrd') {
    party = 'pve';
  } else if(party == 'prd01') {
    party = 'prd';
  } else if(party == 'LogoMorena') {
    party = 'morena';
  } else if(party == 'logo_movimiento_ciudadano') {
    party = 'movimiento ciudadano';
  } else if(party == 'panal') {
    party = 'panal';
  } else if(party == 'independiente') {
    party = 'independiente';
  } else if(party == 'encuentro') {
    party = 'encuentro';
  } else if(party == 'logo_SP') {
    party = 'sp';
  }
  return party;
}

models.sequelize.sync().then(function () {
  var namesKeyGen = new KeyGenerator();
  var districtKeyGen = new KeyGenerator();
  var seatHashMap = new HashMap();
  var pluriHashMap = new HashMap();

  var readDiputado = function(index, next) {
    var d = {
      id: index
    };

    var seat = {};

    var options =  {
        encoding: null,
        method: 'GET',
        url: 'http://sitl.diputados.gob.mx/LXIII_leg/curricula.php?dipt=' + d.id,
        noResponseRetries: 5,
        retries: 5
    }
    request(options, function(err, response, html) {
        if(!err){
            var $ = cheerio.load(iconv.decode(new Buffer(html), 'ISO-8859-1'));

            $('table table table tbody tr td strong').filter(function(index){
                //Take value
                value = $(this).text().trim();
                //Evaluate destiny field
                switch (index) {
                  case 0: param = 'displayName'; break;
                  //Seat
                  case 1: param = 'type'; break;
                  case 2: param = 'state'; break;
                  case 3: param = 'area'; break;
                  //Deputy
                  case 4: param = 'curul'; break;
                  case 5: param = 'email'; break;
                  case 6: param = 'birthdate'; break;
                  case 7: param = 'alternate'; break;
                }

                if(index == 1 || index == 2 || index == 3) { // Seat information
                  seat[param] = value;
                } else if(index == 0 || index == 7) { // Deputy information
                  d[param] = cleanDeputyName(value);
                  hash = namesKeyGen.generateKeyForTerm(d[param], ' ');
                  if(index == 0) {
                    d['hash'] = hash;
                    d['slug'] = normalize(d[param].toLowerCase()).replace(/ /g, '-');
                  } else {
                    d['altHash'] = hash;
                  }
                } else {
                  d[param] = decodeURIComponent(value);
                }

            });

            $('table tr td img').filter(function(index){
                src = $(this).attr('src');
                switch (index) {
                  case 1:
                    d['picture'] = src;
                    break;
                  case 2:
                    regex = /.*\/(\w+)\..*/.exec(src);
                    d['party'] = identifyParty(regex != null? regex[1]:'Uknown');
                    break;
                }
            });

            // seat = { type: 'Mayoria Relativa', state: 'NL' , area: '1' , curul: null}
            if(seat.type == 'Mayoría Relativa') {
              d.SeatId = seat.id = districtKeyGen.generateKey(seat.type + '-' + seat.state + '-' + seat.area);
            } else { //Porporcional aka Plurinominal
              if(seatHashMap.containsKey(d.hash)) { //
                // console.log('Are we reprocessing deputies?!')
                seat = seatHashMap.get(d.hash);
                d.SeatId = seat.id;
              } else if(seatHashMap.containsKey(d.altHash)) { // We are processing alternate deputy, seat was process before
                // console.log('processing alternate');
                seat = seatHashMap.get(d.altHash);
                d.SeatId = seat.id;
              } else { //First time we process this seat
                // console.log('First processing')
                var plurinominal = 1;
                var key = seat.type + '-' + seat.area; // Key for circunscription
                if(pluriHashMap.containsKey(key)) {
                  plurinominal = pluriHashMap.get(key);
                }
                //Increment plurinominal count
                pluriHashMap.put(key, plurinominal + 1);

                seat.curul = plurinominal;
                d.SeatId = seat.id = districtKeyGen.generateKey(key + '-' + seat.curul);
                seatHashMap.put(d.hash, seat);
                seatHashMap.put(d.altHash, seat);
              }
            }

            console.log('>> ' + d.id + ' - ' + d.displayName + ' (' + seat.type + ' '  + seat.state + ' Dto.' + seat.area + ')');

            next(null, [seat, d]);
        } else {
          console.log(`ERROR: ${d.id} with ${err.code} -------------------------------------------------------------------------`);
          next(null, d.id);
        }
    });
  }

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

  var loadDistricts = function(callback) {

    var queryString  = 'select s.id, s.type, s.state, s.area, s.curul, d.hash, d.altHash from Seats s join Deputies d on s.id = d.SeatId';
    models.sequelize
    .query(queryString, { type: models.sequelize.QueryTypes.SELECT })
    .then(function(seats) {
      seats.forEach(function(seat) {
        if(seat.type == 'Mayoría Relativa') {
          districtKeyGen.loadPair(seat.type + '-' + seat.state + '-' + seat.area, seat.id);
        } else {
          districtKeyGen.loadPair(seat.type + '-' + seat.area + '-' + seat.curul, seat.id);
          seatHashMap.put(seat.hash, seat);
          seatHashMap.put(seat.altHash, seat);
          let plurinominal = 1;
          let key = seat.type + '-' + seat.area;
          if(pluriHashMap.containsKey(key)) {
            plurinominal = pluriHashMap.get(key);
          }
          pluriHashMap.put(key, plurinominal + 1);

        }
      });
      callback(null, true);
    });
  }

  var loadCirc = function(callback) {

    var queryString  = 'select s.area, max(s.curul) as number from Seats s where s.type = \'Representación proporcional\' group by s.area';
    models.sequelize
    .query(queryString, { type: models.sequelize.QueryTypes.SELECT })
    .then(function(circunscription) {
      circunscription.forEach((c) => {
        pluriHashMap.put('Representación proporcional' + '-' + c.area, c.number + 1);
      });
      callback(null, true);
    });
  }

  var bulkCreateDeputies = function(seats, deputies) {
    models.Seat
    .bulkCreate(seats, { ignoreDuplicates: true })
    .then(function(seats) {
      models.Deputy
        .bulkCreate(deputies, { ignoreDuplicates: true })
        .then(function(deputies) {
          models.Name
            .bulkCreate(namesKeyGen.hashRecord, { ignoreDuplicates: true })
            .then(function(names) {
              console.log(seats.length + ' seats have been saved');
              console.log(deputies.length + ' diputados have been saved');
              console.log(names.length + ' names have been saved');
            });
        });
    });
  }

  var scrapeDeputies = function(callback) {
    //Reading arguments from=X to=Y
    var sequence = argv();
    async.mapSeries(sequence.ids, readDiputado, function(err, bulkDeputies) {
      let missing = [];
      let deputies = [];
      let seats = [];
      bulkDeputies.map(function(item) {
        // If item is a number, then deputy could not been processed
        if(typeof item === 'number') {
          missing.push(item);
        } else {
          seats.push(item[0]);
          deputies.push(item[1]);
        }
      });

      bulkCreateDeputies(seats, deputies);
      console.log(`Missing ${missing}`);
      if(missing.length == 0)
        callback(null, true);
      else {
        console.log(`Processing missing deputies ${missing.length}`);
        async.map(missing, readDiputado, function(err, bulkDeputies) {
          let missing = [];
          let deputies = [];
          let seats = [];
          bulkDeputies.map(function(item) {
            // If item is a number, then deputy could not been processed
            if(typeof item === 'number') {
              missing.push(item);
            } else {
              seats.push(item[0]);
              deputies.push(item[1]);
            }
          });

          bulkCreateDeputies(seats, deputies);

          console.log(`Missing: ${missing}`);

          callback(null, true);
        });
      }

    });

  }

  async.series([loadNamesHash, loadDistricts, loadCirc, scrapeDeputies], function(err, results) {
    console.log('Finished');
  });

});
