const {
  loadSelfRegisteredDefinitions,
} = require("../utils/commandLoader");

/*
  All Studio PA slash commands are self-registering.

  Each file in /commands exports a `data` (SlashCommandBuilder)
  and `execute` function. This file simply gathers the JSON
  definitions for registration with Discord.
*/

module.exports = loadSelfRegisteredDefinitions();
