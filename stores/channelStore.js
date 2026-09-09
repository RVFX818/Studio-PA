const fs = require("fs");
const path = require("path");

const dataDirectory = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDirectory, "channelSettings.json");

function ensureStore() {
  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({}, null, 2));
  }
}

function readStore() {
  ensureStore();

  try {
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch (error) {
    console.error("Failed to read channel settings:", error);
    return {};
  }
}

function writeStore(data) {
  ensureStore();
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function getSavedSlowmode(channelId) {
  const data = readStore();

  return data[channelId]?.originalSlowmode ?? null;
}

function saveOriginalSlowmode(channelId, seconds) {
  const data = readStore();

  if (!data[channelId]) {
    data[channelId] = {};
  }

  // Only save the original value once.
  // Running /slowmode set repeatedly will not overwrite the baseline.
  if (data[channelId].originalSlowmode === undefined) {
    data[channelId].originalSlowmode = seconds;
  }

  writeStore(data);
}

function clearSavedSlowmode(channelId) {
  const data = readStore();

  if (!data[channelId]) return;

  delete data[channelId].originalSlowmode;

  if (Object.keys(data[channelId]).length === 0) {
    delete data[channelId];
  }

  writeStore(data);
}

module.exports = {
  getSavedSlowmode,
  saveOriginalSlowmode,
  clearSavedSlowmode,
};
