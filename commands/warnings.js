const { EmbedBuilder } = require("discord.js");

const isAdmin = require("../utils/isAdmin");

const {
  getUserRecord,
} = require("../utils/moderationStore");

module.exports = {
  async execute(interaction) {
    try {
      if (!(await isAdmin(interaction))) {
        return interaction.reply({
          content: "You do not have permission to use this command.",
          ephemeral: true,
        });
      }

      const user = interaction.options.getUser("member");

      const record = getUserRecord(user.id);

      const warnings = record.warnings || [];
      const offenses = record.autoModOffenses || [];

      let warningText = "No warnings recorded.";

      if (warnings.length > 0) {
        warningText = warnings
          .slice(-10)
          .reverse()
          .map((warning, index) => {
            const timestamp = Math.floor(
              warning.timestamp / 1000
            );

            return (
              `**${warnings.length - index}.** ${warning.reason}\n` +
              `Moderator: <@${warning.moderatorId}> • ` +
              `<t:${timestamp}:R>\n` +
              `ID: \`${warning.id}\``
            );
          })
          .join("\n\n");
      }

      const embed = new EmbedBuilder()
        .setTitle("Moderation History")
        .setThumbnail(
          user.displayAvatarURL({
            size: 256,
          })
        )
        .setDescription(`${user}`)
        .addFields(
          {
            name: "Manual Warnings",
            value: String(warnings.length),
            inline: true,
          },
          {
            name: "AutoMod Offenses",
            value: String(offenses.length),
            inline: true,
          },
          {
            name: "Recent Warnings",
            value: warningText.slice(0, 1024),
            inline: false,
          }
        )
        .setFooter({
          text: "Studio PA • Moderation History",
        })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    } catch (error) {
      console.error("Warnings command failed:", error);

      if (!interaction.replied) {
        await interaction.reply({
          content: "Failed to load moderation history.",
          ephemeral: true,
        });
      }
    }
  },
};
