const {
  MessageFlags,
} = require("discord.js");

const {
  loadCommandHandlers,
} = require("../utils/commandLoader");

const commands =
  loadCommandHandlers();

module.exports = {
  async execute(interaction) {
    if (
      !interaction.isChatInputCommand()
    ) {
      return;
    }

    const command =
      commands.get(
        interaction.commandName
      );

    if (!command) {
      console.warn(
        `No handler found for /${interaction.commandName}`
      );

      if (
        !interaction.replied &&
        !interaction.deferred
      ) {
        await interaction.reply({
          content:
            "Studio PA could not find that command.",
          flags:
            MessageFlags.Ephemeral,
        });
      }

      return;
    }

    try {
      await command.execute(
        interaction
      );
    } catch (error) {
      console.error(
        `Command /${interaction.commandName} failed:`,
        error
      );

      if (
        !interaction.replied &&
        !interaction.deferred
      ) {
        await interaction.reply({
          content:
            "Something went wrong while running that command.",
          flags:
            MessageFlags.Ephemeral,
        });
      }
    }
  },
};
