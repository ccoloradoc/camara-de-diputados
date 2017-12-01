"use strict";

module.exports = function(sequelize, DataTypes) {
  var Attendance = sequelize.define("Attendance", {
    attendance: { type: DataTypes.STRING, name: 'attendance' },
    attendanceDate: { type: DataTypes.DATE, name: 'attendance_date' },
    sessionId: { type: DataTypes.INTEGER, name: 'sessionId' }
  }, {
    classMethods: {
      associate: function(models) {
        models.Attendance.belongsTo(models.Deputy);
      }
    }
  });

  return Attendance;
};
