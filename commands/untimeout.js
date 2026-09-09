const {
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} = require("discord.js");

const isAdmin = require("../utils/isAdmin");

const {
  addModAction,
} = require("../stores/moderationStore");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("Remove a member timeout")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member to remove timeout from")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for removing the timeout")
        .setRequired(false)
        .setMaxLength(500)
    ),

  async execute(interaction) {
    try {
      if (!(await isAdmin(interaction))) {
        return interaction.reply({
          content: "You do not have permission to use this command.",
          flags: MessageFlags.Ephemeral,
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
          flags: MessageFlags.Ephemeral,
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
              "Studio PA � Moderation",
          })
          .setTimestamp();

        await logChannel.send({
          embeds: [embed],
        });
      }

      await interaction.reply({
        content:
          `Removed timeout from ${targetUser}.`,
        flags: MessageFlags.Ephemeral,
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
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
