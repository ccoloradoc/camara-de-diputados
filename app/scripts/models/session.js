"use strict";

module.exports = function(sequelize, DataTypes) {
  var Session = sequelize.define("Session", {
    name: { type: DataTypes.STRING, name: 'name', unique: true }
  }, {
    classMethods: {
      associate: function(models) {
        Session.hasMany(models.Attendance, { as: 'attendances'});
        Session.hasMany(models.Initiative, { as: 'initiatives'});
      }
    }
  });

  return Session;
};
