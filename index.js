const fs = require('fs');
const path = require('path');
const Q = require('q');
const ExifImage = require('exif').ExifImage;

function getExif(filename) {
  const deferred = Q.defer();
  try {
    new ExifImage({ image: filename }, (error, exifData) => {
      if (error) {
        error.filename = filename;
        deferred.reject(error);
      } else {
        deferred.resolve(exifData);
      }
    });
  } catch (error) {
    error.filename = filename;
    deferred.reject(error);
  }

  return deferred.promise;
}

const dirname = 'images';

Q.nfcall(fs.readdir, dirname)
.then(files => (
  Q.all(files.map(file => (
    getExif(path.resolve(dirname, file))
    .then(exifData => {
      let createDate = exifData.exif.CreateDate || exifData.image.CreateDate;
      const newName = createDate.replace(/:/g, '').replace(' ', '_') + '.jpg';
      return { file, newName };
    })
  )))
))
.then(results => {
  console.log(`${results.length} files will be renamed...`);
  return Q.all(results.map(result => {
    const oldName = path.resolve(dirname, result.file);
    const newName = path.resolve(dirname, result.newName);
    return Q.nfcall(fs.rename, oldName, newName);
  }));
})
.then(results => {
  console.log(`done!`);
})
.catch(error => {
  console.error(error);
});
