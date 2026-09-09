const { EmbedBuilder } = require("discord.js");

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

      const minutes =
        interaction.options.getInteger("minutes");

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
            "I cannot timeout that member. Check the role hierarchy.",
          ephemeral: true,
        });
      }

      await member.timeout(
        minutes * 60 * 1000,
        reason
      );

      addModAction(targetUser.id, {
        type: "Timeout",
        moderatorId: interaction.user.id,
        reason,
        durationMinutes: minutes,
        source: "manual",
      });

      const logChannel =
        await interaction.guild.channels.fetch(
          process.env.LOGGING_CHANNEL_ID
        );

      const embed = new EmbedBuilder()
        .setTitle("Member Timed Out")
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
            name: "Duration",
            value: `${minutes} minute(s)`,
            inline: true,
          },
          {
            name: "Reason",
            value: reason,
            inline: false,
          }
        )
        .setFooter({
          text: "Studio PA • Moderation",
        })
        .setTimestamp();

      await logChannel.send({
        embeds: [embed],
      });

      console.log(
        `Moderation log sent: Timeout ${targetUser.tag}`
      );

      await interaction.reply({
        content:
          `Timed out ${targetUser} for ` +
          `**${minutes} minute(s)**.\n` +
          `Reason: ${reason}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(
        "Timeout command failed:",
        error
      );

      if (
        !interaction.replied &&
        !interaction.deferred
      ) {
        await interaction.reply({
          content:
            "Failed to complete the timeout command.",
          ephemeral: true,
        });
      }
    }
  },
};
