const {
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} = require("discord.js");

const isAdmin = require("../utils/isAdmin");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("View Studio PA admin commands"),

  async execute(interaction) {
    try {
      if (!(await isAdmin(interaction))) {
        return interaction.reply({
          content: "You do not have permission to use this command.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle("Studio PA � Admin Help")
        .setDescription(
          "Available Studio PA administration and moderation commands."
        )
        .addFields(
          {
            name: "Moderation",
            value: [
              "`/warn` � Add a manual warning",
              "`/warnings` � View warning history",
              "`/remove-warning` � Remove one warning",
              "`/clear-warnings` � Clear all manual warnings",
              "`/mod-history` � View full moderation history",
              "`/timeout` � Temporarily timeout a member",
              "`/untimeout` � Remove a timeout",
              "`/kick` � Remove a member from the server",
              "`/ban` � Ban a member",
              "`/purge` � Delete recent messages",
            ].join("\n"),
            inline: false,
          },
          {
            name: "Studio Management",
            value: [
              "`/post-info` � Post the Renaissance VFX info embed",
              "`/status` � View bot uptime, ping, memory, and health",
              "`/help` � Show this command guide",
            ].join("\n"),
            inline: false,
          },
          {
            name: "Automatic Protection",
            value: [
              "Discord AutoMod integration",
              "Scam and invite-link blocking",
              "Repeated-message detection",
              "Caps and repeated-character spam detection",
              "Automatic timeout escalation",
              "Raid detection",
              "New-account risk alerts",
            ].join("\n"),
            inline: false,
          },
          {
            name: "Destructive Commands",
            value:
              "`/kick`, `/ban`, `/purge`, and `/clear-warnings` make immediate changes. Double-check the target before running them.",
            inline: false,
          }
        )
        .setFooter({
          text: "Studio PA � Renaissance VFX",
        })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Help command failed:", error);

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "Failed to load Studio PA help.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
