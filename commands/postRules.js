const {
  MessageFlags,
  SlashCommandBuilder,
} = require("discord.js");

const isAdmin =
  require("../utils/isAdmin");

const {
  syncRulesMessage,
} = require("../services/rulesMessage");

module.exports = {
  data:
    new SlashCommandBuilder()
      .setName("post-rules")
      .setDescription(
        "Update the Renaissance VFX rules message"
      ),

  async execute(interaction) {
    try {
      if (
        !(await isAdmin(interaction))
      ) {
        return interaction.reply({
          content:
            "You do not have permission to use this command.",
          flags:
            MessageFlags.Ephemeral,
        });
      }

      const result =
        await syncRulesMessage(
          interaction.client
        );

      await interaction.reply({
        content:
          result.created
            ? "Rules message created."
            : "Rules message updated.",
        flags:
          MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error(
        "Failed to sync rules message:",
        error
      );

      if (
        !interaction.replied &&
        !interaction.deferred
      ) {
        await interaction.reply({
          content:
            "Failed to update the rules message.",
          flags:
            MessageFlags.Ephemeral,
        });
      }
    }
  },
};
