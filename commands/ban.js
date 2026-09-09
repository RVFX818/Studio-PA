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
    .setName("ban")
    .setDescription("Ban a member")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member to ban")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the ban")
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

      if (!member.bannable) {
        return interaction.reply({
          content:
            "I cannot ban that member. Check the role hierarchy.",
          flags: MessageFlags.Ephemeral,
        });
      }

      addModAction(targetUser.id, {
        type: "Ban",
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
          .setTitle("Member Banned")
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

      await member.ban({
        reason,
      });

      await interaction.reply({
        content:
          `${targetUser.tag} was banned.\n` +
          `Reason: ${reason}`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error(
        "Ban command failed:",
        error
      );

      if (
        !interaction.replied &&
        !interaction.deferred
      ) {
        await interaction.reply({
          content:
            "Failed to ban that member.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
