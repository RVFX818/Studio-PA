const {
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
  SlashCommandBuilder,
} = require("discord.js");

const isAdmin = require("../utils/isAdmin");
const {
  addModAction,
} = require("../stores/moderationStore");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlock the current channel"),

  async execute(interaction) {
    try {
      if (!(await isAdmin(interaction))) {
        return interaction.reply({
          content: "You do not have permission to use this command.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const channel = interaction.channel;

      if (!channel || !channel.isTextBased()) {
        return interaction.reply({
          content: "This command can only be used in a text channel.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const botMember = interaction.guild.members.me;

      if (
        !botMember.permissions.has(
          PermissionFlagsBits.ManageChannels
        )
      ) {
        return interaction.reply({
          content:
            "Studio PA does not have the Manage Channels permission.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const everyoneRole = interaction.guild.roles.everyone;

      await channel.permissionOverwrites.edit(
        everyoneRole,
        {
          SendMessages: null,
        }
      );

      addModAction(interaction.user.id, {
        type: "Channel Unlock",
        moderatorId: interaction.user.id,
        reason: `Unlocked #${channel.name}`,
        source: "manual",
      });

      const logChannel =
        await interaction.guild.channels.fetch(
          process.env.LOGGING_CHANNEL_ID
        );

      if (
        logChannel &&
        logChannel.isTextBased()
      ) {
        const embed = new EmbedBuilder()
          .setTitle("\u{1F513} Channel Unlocked")
          .addFields(
            {
              name: "Channel",
              value: `${channel}`,
              inline: true,
            },
            {
              name: "Moderator",
              value: `${interaction.user}`,
              inline: true,
            }
          )
          .setFooter({
            text: "Studio PA � Moderation",
          })
          .setTimestamp();

        await logChannel.send({
          embeds: [embed],
        });
      }

      await interaction.reply({
        content: `\u{1F513} ${channel} has been unlocked.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Unlock command failed:", error);

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "Failed to unlock this channel.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
