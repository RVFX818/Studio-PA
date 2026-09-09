const {
  EmbedBuilder,
} = require("discord.js");

const isAdmin = require("../utils/isAdmin");

const {
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

      const targetUser =
        interaction.options.getUser("member");

      const reason =
        interaction.options.getString("reason") ||
        "No reason provided";

      const member =
        await interaction.guild.members.fetch(
          targetUser.id
        );

      if (!member.moderatable) {
        return interaction.reply({
          content:
            "I cannot modify that member.",
          ephemeral: true,
        });
      }

      await member.timeout(
        null,
        reason
      );

      addModAction(targetUser.id, {
        type: "Timeout Removed",
        moderatorId: interaction.user.id,
        reason,
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
          .setTitle("Timeout Removed")
          .setThumbnail(
            targetUser.displayAvatarURL({
              size: 256,
            })
          )
          .addFields(
            {
              name: "Member",
              value: `${targetUser}`,
              inline: true,
            },
            {
              name: "Moderator",
              value: `${interaction.user}`,
              inline: true,
            },
            {
              name: "Reason",
              value: reason,
              inline: false,
            }
          )
          .setFooter({
            text:
              "Studio PA • Moderation",
          })
          .setTimestamp();

        await logChannel.send({
          embeds: [embed],
        });
      }

      await interaction.reply({
        content:
          `Removed timeout from ${targetUser}.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(
        "Untimeout command failed:",
        error
      );

      if (
        !interaction.replied &&
        !interaction.deferred
      ) {
        await interaction.reply({
          content:
            "Failed to remove the timeout.",
          ephemeral: true,
        });
      }
    }
  },
};
