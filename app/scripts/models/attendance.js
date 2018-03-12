"use strict";

module.exports = function(sequelize, DataTypes) {
  var Attendance = sequelize.define("Attendance", {
    attendance: { type: DataTypes.STRING, name: 'attendance' },
    description: { type: DataTypes.STRING, name: 'description' },
    attendanceDate: { type: DataTypes.DATE, name: 'attendance_date' }
    // SessionId: { type: DataTypes.INTEGER, name: 'SessionId' }
  }, {
    classMethods: {
      associate: function(models) {
        models.Attendance.belongsTo(models.Deputy);
        models.Attendance.belongsTo(models.Session);
        models.Attendance.belongsTo(models.Seat);
      }
    }
  });

  return Attendance;
};
