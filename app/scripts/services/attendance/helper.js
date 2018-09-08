
function parseDate(stringDate) {
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

function attendanceDescription(name) {
  switch (name) {
    case 'A':
      return 'Asistencia por sistema';
    case 'AO':
      return 'Asistencia por Comisión Oficial';
    case 'PM':
      return 'Permiso de Mesa Directiva';
    case 'IV':
      return 'Inasistencia por Votaciones';
    case 'AC':
      return 'Asistencia por cédula';
    case 'IJ':
      return 'Inasistencia justificada';
    case 'I':
      return 'Inasistencia';
    case 'NA':
      return 'No hay registro';
    default:
      return '';
  }
}

exports.parseDate = parseDate;
exports.attendanceDescription = attendanceDescription;
