const fs = require('fs');
const path = require('path');

const code = `
if (typeof exports.default === 'function') {
  module.exports = exports.default;
  Object.assign(module.exports, exports);
}
`.trim();

const pathToDist = path.join(__dirname, 'dist');
const pathToPackageJson = path.join(__dirname, 'package.json');
const newline = '\n';

async function appendToFile(filePath, text) {
  return await fs.promises.appendFile(filePath, `${text}${newline}`);
}

async function fixModuleResolution() {
  const files = await fs.promises.readdir(pathToDist);
  const jsFiles = files.filter(filename => filename.endsWith('.js'));

  const fullPaths = jsFiles.map(filename => path.join(pathToDist, filename));

  for (const fullPath of fullPaths) {
    await appendToFile(fullPath, code);
  }
}

async function copyPackageJsonToDist() {
  return await fs.promises.copyFile(pathToPackageJson, path.join(pathToDist, 'package.json'))
}

; (async () => {
  await fixModuleResolution();
  console.log('=> Fixed module resolution');
  await copyPackageJsonToDist();
  console.log('=> Copy package.json to dist');
  console.log('=> postbuild DONE');
})();
