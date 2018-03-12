


module.exports  = function() {
  var sequence = { ids:[] };

  process.argv.forEach(function (val, index, array) {
    console.log(val)
    regex = /(\w+)=([a-z0-9-]+)/.exec(val);
    if(regex != null && regex != undefined) {
      param = regex[1];
      value = isNaN(regex[2])? regex[2] : parseInt(regex[2]);
      sequence[param] = value;
    }
  });

  while(sequence.ids.length <= sequence.to - sequence.from)
    sequence.ids.push(sequence.from + sequence.ids.length);

  return sequence;
};
