"use strict";

module.exports = function(sequelize, DataTypes) {
  var Deputy = sequelize.define("Deputy", {
    id: { type: DataTypes.INTEGER, name: 'id', primaryKey: true },
    displayName: { type: DataTypes.STRING, name: 'display_name' },
    curul: { type: DataTypes.STRING, name: 'curul' },
    email: { type: DataTypes.STRING, name: 'email' },
    birthdate: { type: DataTypes.STRING, name: 'birthdate' },
    picture: { type: DataTypes.STRING, name: 'picture' },
    party: { type: DataTypes.STRING, name: 'party', defaultValue: 'Uknown' },
    alternate: { type: DataTypes.STRING, name: 'alternate' },
    hash: { type: DataTypes.STRING, name: 'hash', defaultValue: 0 },
    altHash: { type: DataTypes.STRING, name: 'alt_hash', defaultValue: 0 },
    slug: { type: DataTypes.STRING, name: 'slug'},
    attendances: { type: DataTypes.INTEGER, name: 'attendances'},
    latestAttendance: { type: DataTypes.DATE, name: 'latestAttendance'}
  }, {
    classMethods: {
      associate: function(models) {
        Deputy.belongsTo(models.Seat);
        // Deputy.hasOne(models.Profile, { as: 'profile', foreignKey: 'id'});
      }
    }
  });

  return Deputy;
};
