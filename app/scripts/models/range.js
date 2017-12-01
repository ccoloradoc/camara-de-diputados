"use strict";

module.exports = function(sequelize, DataTypes) {
  var Range = sequelize.define("Range", {
    sid: { type: DataTypes.INTEGER, name: 'sid'},
    mid: { type: DataTypes.INTEGER, name: 'mid'},
    district: { type: DataTypes.INTEGER, name: 'district'},
    start: { type: DataTypes.INTEGER, name: 'start'},
    end: { type: DataTypes.INTEGER, name: 'end'},
    total: { type: DataTypes.STRING, name: 'total' }
  }, {
    classMethods: {
      associate: function(models) {
      }
    }
  });

  return Range;
};
