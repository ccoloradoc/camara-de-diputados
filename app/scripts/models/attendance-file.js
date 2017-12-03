"use strict";

module.exports = function(sequelize, DataTypes) {
  var AttendanceFile = sequelize.define("AttendanceFile", {
    name: { type: DataTypes.STRING, name: 'name', unique: true },
    path: { type: DataTypes.STRING, name: 'path' },
    type: { type: DataTypes.STRING, name: 'type' },
    step: { type: DataTypes.INTEGER, name: 'step' } // 0 - Identified(Scrape), 1 - Downloaded, 2 - Imported
  }, {
    classMethods: {
      associate: function(models) {

      }
    }
  });

  return AttendanceFile;
};
