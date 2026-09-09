const fs = require("fs");
const path = require("path");

const dataPath = path.join(
  __dirname,
  "..",
  "data",
  "moderation.json"
);

function readData() {
  try {
    if (!fs.existsSync(dataPath)) {
      fs.writeFileSync(dataPath, "{}");
    }

    return JSON.parse(
      fs.readFileSync(dataPath, "utf8") || "{}"
    );
  } catch (error) {
    console.error("Failed to read moderation data:", error);
    return {};
  }
}

function writeData(data) {
  fs.writeFileSync(
    dataPath,
    JSON.stringify(data, null, 2)
  );
}

function ensureUser(data, userId) {
  if (!data[userId]) {
    data[userId] = {
      autoModOffenses: [],
      messageProtectionOffenses: [],
      warnings: [],
      modActions: [],
    };
  }

  if (!Array.isArray(data[userId].autoModOffenses)) {
    data[userId].autoModOffenses = [];
  }

  if (!Array.isArray(data[userId].messageProtectionOffenses)) {
    data[userId].messageProtectionOffenses = [];
  }

  if (!Array.isArray(data[userId].warnings)) {
    data[userId].warnings = [];
  }

  if (!Array.isArray(data[userId].modActions)) {
    data[userId].modActions = [];
  }

  return data[userId];
}

function addAutoModOffense(userId, offense) {
  const data = readData();
  const record = ensureUser(data, userId);

  record.autoModOffenses.push({
    timestamp: Date.now(),
    ruleId: offense.ruleId || null,
    ruleName: offense.ruleName || null,
    channelId: offense.channelId || null,
    matchedKeyword: offense.matchedKeyword || null,
  });

  writeData(data);

  return record.autoModOffenses.length;
}

function addMessageProtectionOffense(userId, offense) {
  const data = readData();
  const record = ensureUser(data, userId);

  record.messageProtectionOffenses.push({
    timestamp: Date.now(),
    type: offense.type || "Unknown",
    channelId: offense.channelId || null,
    content: offense.content || null,
  });

  writeData(data);

  return record.messageProtectionOffenses.length;
}

function addWarning(userId, warning) {
  const data = readData();
  const record = ensureUser(data, userId);

  const newWarning = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    moderatorId: warning.moderatorId,
    reason: warning.reason,
  };

  record.warnings.push(newWarning);

  writeData(data);

  return {
    warning: newWarning,
    count: record.warnings.length,
  };
}

function removeWarning(userId, warningId) {
  const data = readData();
  const record = ensureUser(data, userId);

  const index = record.warnings.findIndex(
    (warning) => warning.id === warningId
  );

  if (index === -1) {
    return null;
  }

  const [removed] = record.warnings.splice(index, 1);

  writeData(data);

  return {
    warning: removed,
    count: record.warnings.length,
  };
}

function clearWarnings(userId) {
  const data = readData();
  const record = ensureUser(data, userId);

  const removedCount = record.warnings.length;

  record.warnings = [];

  writeData(data);

  return removedCount;
}

function addModAction(userId, action) {
  const data = readData();
  const record = ensureUser(data, userId);

  const newAction = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    type: action.type,
    moderatorId: action.moderatorId || null,
    reason: action.reason || "No reason provided",
    durationMinutes:
      typeof action.durationMinutes === "number"
        ? action.durationMinutes
        : null,
    source: action.source || "manual",
  };

  record.modActions.push(newAction);

  writeData(data);

  return newAction;
}

function getUserRecord(userId) {
  const data = readData();

  return ensureUser(data, userId);
}

module.exports = {
  addAutoModOffense,
  addMessageProtectionOffense,
  addWarning,
  removeWarning,
  clearWarnings,
  addModAction,
  getUserRecord,
};
