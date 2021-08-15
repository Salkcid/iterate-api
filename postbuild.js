const fs = require('fs');
const path = require('path');

const code = `
if (typeof exports.default === 'function') {
  module.exports = exports.default;
  Object.assign(module.exports, exports);
}
`.trim();

const pathToDist = path.join(__dirname, 'dist');
const newline = '\n';

async function appendToFile(filePath, text) {
  return await fs.promises.appendFile(filePath, `${text}${newline}`);
}

; (async () => {
  const files = await fs.promises.readdir(pathToDist);
  const jsFiles = files.filter(filename => filename.endsWith('.js'));

  const fullPaths = jsFiles.map(filename => path.join(pathToDist, filename));

  for (const fullPath of fullPaths) {
    await appendToFile(fullPath, code);
  }
})();
