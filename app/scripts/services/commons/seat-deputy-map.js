
function seatString(seat) {
  return ` Seat[ K: ${seat.id} - ${seat.state} ${seat.area} ${seat.type}]`;
}

class SeatDeputyMap {
  constructor(fixed) {
    // Fixed scenarios
    this.fixed = fixed;

    // Mapping and reference
    this.seatDeputyMap = {};
    this.seatDeputyIdMap = {};

    // Keep track of IDs
    this.proportional = {};
    this.seatIdHelper = {};

    // Store objects with ID
    this.seats = [];
    this.deputies = [];
  }

  loadShortReport() {
    let keys = Object.keys(this.seatDeputyIdMap);
    console.log(` - ${keys.length} seat - deputy map entries loaded`);
  }

  loadReport() {
    for (var key in this.seatDeputyMap) {
       if (this.seatDeputyMap.hasOwnProperty(key)) {
          console.log(key, ' - ', seatString(this.seatDeputyMap[key]));
       }
    }

    for (var key in this.seatIdHelper) {
       if (this.seatIdHelper.hasOwnProperty(key)) {
          console.log(key, ' - ', seatString(this.seatIdHelper[key]));
       }
    }
  }

  report() {
    console.log('Seats: ');
    this.seats.forEach(seat => console.log(` > ${seat.id}: ${seat.state} ${seat.area} ${seat.type}`));
    console.log('Deputies: ');
    this.deputies.forEach(deputy => console.log(` > ${deputy.id}: ${deputy.displayName} ${deputy.SeatId}`));
  }

  generateKey(seat) {
    let key = seat.type + '-' + seat.state + '-' + seat.area;
    if(seat.type !== 'Mayoría Relativa') { // Processing proportional deputy
      let proportionalKey = seat.state + '-' + seat.area;
      if(!this.proportional.hasOwnProperty(proportionalKey)) { // We have not process deputies from this area
        this.proportional[proportionalKey] = 1;
      }
      key = seat.state + '-' + seat.area + '-' + this.proportional[proportionalKey];
      // Increase counter
      this.proportional[proportionalKey] = this.proportional[proportionalKey] + 1;
    }
    return key;
  }

  populate(seat, deputy) {
    let key = this.generateKey(seat);
    this.seatIdHelper[key] = seat;
    this.seatDeputyMap[deputy.hash] = this.seatDeputyMap[deputy.altHash] = seat;
    this.seatDeputyIdMap[deputy.DeputyId] = seat;
  }

  map(seat, deputy) {
    // LXIII Special scenario, there are 2 plurinominal seats with 3 deputies
    if(this.fixed.hasOwnProperty(deputy.id)) {
      console.log('Special scenario ', deputy.id)
      seat = this.seatDeputyIdMap[this.fixed[deputy.id]];
    } else if(this.seatDeputyMap.hasOwnProperty(deputy.hash)) {
      seat = this.seatDeputyMap[deputy.hash];
    } else if( deputy.id > 500 // there is a mismatch
      && this.seatDeputyMap.hasOwnProperty(deputy.altHash)) {
      seat = this.seatDeputyMap[deputy.altHash];
    } else {
      let key = this.generateKey(seat);
      console.log('Key ', key)
      this.seatIdHelper[key] = seat;
      deputy.SeatId = seat.id = Object.keys(this.seatIdHelper).length;
      this.seatDeputyMap[deputy.hash] = this.seatDeputyMap[deputy.altHash] = seat;
      this.seats.push(seat);
    }

    // We have an ID on Seat
    deputy.SeatId = seat.id;
    this.deputies.push(deputy);
  }

  findSeatFor(deputy) {
    return this.seatDeputyIdMap[deputy.id];
  }

}

exports.SeatDeputyMap = SeatDeputyMap;
