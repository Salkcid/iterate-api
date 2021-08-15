const fs = require('fs');
const path = require('path');

const pathToDist = path.join(__dirname, 'dist');
const pathToPackageJson = path.join(__dirname, 'package.json');
const pathToREADME = path.join(__dirname, 'README.md');

; (async () => {
  await fs.promises.copyFile(pathToPackageJson, path.join(pathToDist, 'package.json'));
  console.log('=> Copy package.json to dist');
  await fs.promises.copyFile(pathToREADME, path.join(pathToDist, 'README.md'));
  console.log('=> Copy README.md to dist');
})();
