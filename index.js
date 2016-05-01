// sudo apt-get install -y libimage-exiftool-perl

const fs = require('fs');
const path = require('path');
const Q = require('q');
const exec = require('child_process').exec;

function getExif(filename) {
  const deferred = Q.defer();
  exec(`exiftool -j ${filename}`, (error, stdout, stderr) => {
    if (error) {
      err.filename = filename;
      deferred.reject(error);
      return;
    }

    deferred.resolve(JSON.parse(stdout)[0]);
  });

  return deferred.promise;
}

const dirname = 'images';

Q.nfcall(fs.readdir, dirname)
.then(files => (
  Q.all(files.map(file => (
    getExif(path.resolve(dirname, file))
    .then(exifData => {
      const ext = path.extname(file);
      let createDate = exifData.CreateDate || exifData.DateTimeOriginal;
      const newName = createDate.replace(/:/g, '').replace(' ', '_') + ext;
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
