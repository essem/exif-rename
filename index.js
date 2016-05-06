// sudo apt-get install -y libimage-exiftool-perl

const path = require('path');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const execAsync = Promise.promisify(require('child_process').exec);

if (process.argv.length !== 3) {
  console.log('usage: npm start [dirname]');
  process.exit(1);
}

const dirname = process.argv[2];
console.log(`Process ${dirname} directory...`);

fs.readdirAsync(dirname)
.then(files => (
  Promise.all(files.map(file => {
    const filename = path.resolve(dirname, file);
    return execAsync(`exiftool -j ${filename}`)
      .then(stdout => JSON.parse(stdout)[0])
      .then(exifData => {
        const ext = path.extname(file);
        const createDate = exifData.CreateDate || exifData.DateTimeOriginal;
        const newName = createDate.replace(/:/g, '').replace(' ', '_') + ext;
        return { file, newName };
      });
  }))
))
.then(results => {
  console.log(`${results.length} files will be renamed...`);
  return Promise.all(results.map(result => {
    const oldName = path.resolve(dirname, result.file);
    const newName = path.resolve(dirname, result.newName);
    console.log(`${oldName} -> ${newName}`);
    return fs.renameAsync(oldName, newName);
  }));
})
.then(() => {
  console.log('done!');
})
.catch(error => {
  console.error(error);
});
