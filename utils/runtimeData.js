const fs = require("fs");
const path = require("path");

const dataDirectory =
  process.env.DATA_DIRECTORY
    ? path.resolve(process.env.DATA_DIRECTORY)
    : path.join(__dirname, "..", "data");

function ensureDataDirectory() {
  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(
      dataDirectory,
      {
        recursive: true,
      }
    );
  }
}

function getDataFile(filename) {
  ensureDataDirectory();

  return path.join(
    dataDirectory,
    filename
  );
}

module.exports = {
  dataDirectory,
  ensureDataDirectory,
  getDataFile,
};
