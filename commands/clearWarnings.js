const { EmbedBuilder } = require("discord.js");
const isAdmin = require("../utils/isAdmin");

const {
  clearWarnings,
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

      const removedCount =
        clearWarnings(user.id);

      addModAction(user.id, {
        type: "Warnings Cleared",
        moderatorId: interaction.user.id,
        reason: `${removedCount} warning(s) removed`,
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
          .setTitle("Warnings Cleared")
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
              name: "Warnings Removed",
              value: String(removedCount),
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
          `Cleared **${removedCount} warning(s)** from ${user}.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(
        "Clear-warnings command failed:",
        error
      );

      if (!interaction.replied) {
        await interaction.reply({
          content: "Failed to clear warnings.",
          ephemeral: true,
        });
      }
    }
  },
};
