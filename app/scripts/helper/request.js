const request = require('retry-request');

module.exports = (options, callback) => {
  request(options, function(err, response, html) {
    if(!err) {
      callback(err, response, html)
    } else {
      console.log(`Request: First Attempt (Reason: ${err.code})`)
      // Second attempt
      request(options, function(err, response, html) {
        if(!err) {
          callback(err, response, html)
        } else {
          console.log(`Request: Second Attempt (Reason: ${err.code})`)
          // Second attempt
          request(options, function(err, response, html) {
            if(!err) {
              callback(err, response, html)
            } else {
              console.log(`Request: Third Attempt (Reason: ${err.code})`)
              // Second attempt
              request(options, function(err, response, html) {
                if(err)
                  console.log(`Request: Fourth Attempt (Reason: ${err.code})`)
                callback(err, response, html)
              });
            }
          });
        }
      });
    }
  });
}
