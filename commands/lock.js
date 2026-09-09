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
    .setName("lock")
    .setDescription("Lock the current channel"),

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

      const everyoneRole = interaction.guild.roles.everyone;
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

      await channel.permissionOverwrites.edit(
        everyoneRole,
        {
          SendMessages: false,
        }
      );

      addModAction(interaction.user.id, {
        type: "Channel Lock",
        moderatorId: interaction.user.id,
        reason: `Locked #${channel.name}`,
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
          .setTitle("\u{1F512} Channel Locked")
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
        content: `\u{1F512} ${channel} has been locked.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Lock command failed:", error);

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "Failed to lock this channel.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
