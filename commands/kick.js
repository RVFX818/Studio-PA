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
    .setName("kick")
    .setDescription("Kick a member")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member to kick")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the kick")
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

      if (!member.kickable) {
        return interaction.reply({
          content:
            "I cannot kick that member. Check the role hierarchy.",
          flags: MessageFlags.Ephemeral,
        });
      }

      addModAction(targetUser.id, {
        type: "Kick",
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
          .setTitle("Member Kicked")
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

      await member.kick(reason);

      await interaction.reply({
        content:
          `${targetUser.tag} was kicked.\n` +
          `Reason: ${reason}`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error(
        "Kick command failed:",
        error
      );

      if (
        !interaction.replied &&
        !interaction.deferred
      ) {
        await interaction.reply({
          content:
            "Failed to kick that member.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
