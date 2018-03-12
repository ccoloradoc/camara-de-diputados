const KeyGenerator = require("../../helper/keygenerator");

function loadNamesHash(models, callback) {
  var namesKeyGen = new KeyGenerator();
  models.Name.findAll()
    .then(function(names) {
      for(i in names) {
        namesKeyGen.loadPair(names[i].value, names[i].key);
      }
      callback(null, namesKeyGen);
    });
}

exports.loadNamesHash = loadNamesHash;
