const {
  MessageFlags,
  SlashCommandBuilder,
} = require("discord.js");

const isAdmin =
  require("../utils/isAdmin");

const {
  syncFaqMessage,
} = require("../services/faqMessage");

module.exports = {
  data:
    new SlashCommandBuilder()
      .setName("post-faq")
      .setDescription(
        "Update the RVFX Studio FAQ message"
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
        await syncFaqMessage(
          interaction.client
        );

      await interaction.reply({
        content:
          result.created
            ? "FAQ message created."
            : "FAQ message updated.",
        flags:
          MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error(
        "Failed to sync FAQ message:",
        error
      );

      if (
        !interaction.replied &&
        !interaction.deferred
      ) {
        await interaction.reply({
          content:
            "Failed to update the FAQ message.",
          flags:
            MessageFlags.Ephemeral,
        });
      }
    }
  },
};
