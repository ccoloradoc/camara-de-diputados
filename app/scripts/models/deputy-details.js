"use strict";

module.exports = function(sequelize, DataTypes) {
  var DeputyDetails = sequelize.define("DeputyDetails", {
    id: { type: DataTypes.INTEGER, name: 'id', primaryKey: true },
    displayName: { type: DataTypes.STRING, name: 'display_name' },
    alternate: { type: DataTypes.BOOLEAN, name: 'alternate' },
    estudios: { type: DataTypes.STRING, name: 'estudios' },
    profile: { type: DataTypes.STRING, name: 'profile' },
    facebook: { type: DataTypes.STRING, name: 'facebook' },
    twitter: { type: DataTypes.STRING, name: 'twitter' },
    hash: { type: DataTypes.STRING, name: 'hash', defaultValue: 0 },
  }, {
    classMethods: {
      associate: function(models) {

      }
    }
  });

  return DeputyDetails;
};
