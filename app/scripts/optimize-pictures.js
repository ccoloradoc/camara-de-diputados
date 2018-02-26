const fs = require('fs');
const async = require('async');
const cmd = require('node-cmd');
const STORAGE_PATH = './data/storage';

let optimizeImage = function(image, next) {
  let command = `convert ${STORAGE_PATH}/${image} -sampling-factor 4:2:0 -strip -quality 85 -interlace JPEG -colorspace sRGB ${STORAGE_PATH}/${image}`;
  console.log(` - ${command}`)
  cmd.get(
     //`convert ${STORAGE_PATH}/${image} -strip ${STORAGE_PATH}/optimized/${image}`,
     command,
     function(err, data, stderr){
       console.log(stderr);
       console.log('>> ', image);
       next(null, image);
     }
  );
}

// Convert all images to valid PNG format
fs.readdir(STORAGE_PATH, (err, files) => {
 async.mapSeries(files, optimizeImage, (err, result) => {
   // console.log(result);
 });
})
