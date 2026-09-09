const postInfo = require("../commands/postInfo");
const timeout = require("../commands/timeout");
const untimeout = require("../commands/untimeout");
const kick = require("../commands/kick");
const ban = require("../commands/ban");
const purge = require("../commands/purge");
const warn = require("../commands/warn");
const warnings = require("../commands/warnings");
const removeWarning = require("../commands/removeWarning");
const clearWarnings = require("../commands/clearWarnings");
const modHistory = require("../commands/modHistory");
const status = require("../commands/status");
const help = require("../commands/help");

const commands = {
  "post-info": postInfo,
  timeout,
  untimeout,
  kick,
  ban,
  purge,
  warn,
  warnings,
  "remove-warning": removeWarning,
  "clear-warnings": clearWarnings,
  "mod-history": modHistory,
  status,
  help,
};

module.exports = {
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = commands[interaction.commandName];

    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(
        `Command ${interaction.commandName} failed:`,
        error
      );

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "Something went wrong while running that command.",
          ephemeral: true,
        });
      }
    }
  },
};
