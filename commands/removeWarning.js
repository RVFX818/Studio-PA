const { EmbedBuilder } = require("discord.js");
const isAdmin = require("../utils/isAdmin");

const {
  removeWarning,
  addModAction,
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
      const warningId =
        interaction.options.getString("warning-id");

      const result = removeWarning(
        user.id,
        warningId
      );

      if (!result) {
        return interaction.reply({
          content: `No warning with ID \`${warningId}\` was found for ${user}.`,
          ephemeral: true,
        });
      }

      addModAction(user.id, {
        type: "Warning Removed",
        moderatorId: interaction.user.id,
        reason: result.warning.reason,
        source: "manual",
      });

      const logChannel =
        interaction.guild.channels.cache.get(
          process.env.LOGGING_CHANNEL_ID
        );

      if (
        logChannel &&
        logChannel.isTextBased()
      ) {
        const embed = new EmbedBuilder()
          .setTitle("Warning Removed")
          .setThumbnail(
            user.displayAvatarURL({
              size: 256,
            })
          )
          .addFields(
            {
              name: "Member",
              value: `${user}`,
              inline: true,
            },
            {
              name: "Moderator",
              value: `${interaction.user}`,
              inline: true,
            },
            {
              name: "Removed Warning ID",
              value: warningId,
              inline: false,
            },
            {
              name: "Removed Reason",
              value: result.warning.reason,
              inline: false,
            },
            {
              name: "Warnings Remaining",
              value: String(result.count),
              inline: true,
            }
          )
          .setFooter({
            text: "Studio PA • Moderation",
          })
          .setTimestamp();

        await logChannel.send({
          embeds: [embed],
        });
      }

      await interaction.reply({
        content:
          `Removed warning \`${warningId}\` from ${user}. ` +
          `They now have **${result.count} warning(s)**.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(
        "Remove-warning command failed:",
        error
      );

      if (!interaction.replied) {
        await interaction.reply({
          content: "Failed to remove that warning.",
          ephemeral: true,
        });
      }
    }
  },
};
