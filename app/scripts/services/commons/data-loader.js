
function loadDistricts(models, seatDeputiesHolder, callback) {
  var queryString  = 'select s.id, s.type, s.state, s.area, s.curul, d.hash, d.altHash, d.id as DeputyId from Seats s join Deputies d on s.id = d.SeatId order by s.id';
  models.sequelize
  .query(queryString, { type: models.sequelize.QueryTypes.SELECT })
  .then(function(seats) {
    seats.forEach(function(seat) {
      seatDeputiesHolder.populate(seat, seat);
    });
    callback(null, seatDeputiesHolder);
  });
}

exports.loadDistricts = loadDistricts;
