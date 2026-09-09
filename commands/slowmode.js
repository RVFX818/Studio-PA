const {
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require("discord.js");

const isAdmin = require("../utils/isAdmin");

const {
  addModAction,
} = require("../stores/moderationStore");

const {
  getSavedSlowmode,
  saveOriginalSlowmode,
  clearSavedSlowmode,
} = require("../stores/channelStore");

function formatDuration(seconds) {
  if (seconds === 0) return "Off";

  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? "" : "s"}`;
  }

  if (seconds % 3600 === 0) {
    const hours = seconds / 3600;
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }

  if (seconds % 60 === 0) {
    const minutes = seconds / 60;
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}m ${remainingSeconds}s`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Temporarily change or restore channel slowmode")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Set slowmode for the current channel")
        .addIntegerOption((option) =>
          option
            .setName("seconds")
            .setDescription("Slowmode delay in seconds")
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(21600)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("restore")
        .setDescription("Restore the channel's previous slowmode")
    ),

  async execute(interaction) {
    try {
      if (!(await isAdmin(interaction))) {
        return interaction.reply({
          content: "You do not have permission to use this command.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const channel = interaction.channel;

      if (
        !channel ||
        typeof channel.setRateLimitPerUser !== "function"
      ) {
        return interaction.reply({
          content: "Slowmode cannot be changed in this channel.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const botMember = interaction.guild.members.me;

      if (
        !botMember.permissionsIn(channel).has(
          PermissionFlagsBits.ManageChannels
        )
      ) {
        return interaction.reply({
          content:
            "Studio PA does not have Manage Channels permission in this channel.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const subcommand = interaction.options.getSubcommand();

      if (subcommand === "set") {
        const seconds =
          interaction.options.getInteger("seconds", true);

        const currentSlowmode = channel.rateLimitPerUser ?? 0;

        saveOriginalSlowmode(
          channel.id,
          currentSlowmode
        );

        await channel.setRateLimitPerUser(
          seconds,
          `Slowmode changed by ${interaction.user.tag}`
        );

        const originalSlowmode =
          getSavedSlowmode(channel.id);

        addModAction(interaction.user.id, {
          type: "Slowmode Changed",
          moderatorId: interaction.user.id,
          reason:
            `Set #${channel.name} slowmode to ${seconds} seconds`,
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
            .setTitle("\u{23F1}\u{FE0F} Slowmode Changed")
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
              },
              {
                name: "New Slowmode",
                value: formatDuration(seconds),
                inline: true,
              },
              {
                name: "Saved Original",
                value: formatDuration(
                  originalSlowmode ?? 0
                ),
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

        return interaction.reply({
          content:
            `\u{23F1}\u{FE0F} ${channel} slowmode is now **${formatDuration(seconds)}**.` +
            ` Original setting saved as **${formatDuration(originalSlowmode ?? 0)}**.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      if (subcommand === "restore") {
        const savedSlowmode =
          getSavedSlowmode(channel.id);

        if (savedSlowmode === null) {
          return interaction.reply({
            content:
              `There is no saved slowmode setting for ${channel}.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        await channel.setRateLimitPerUser(
          savedSlowmode,
          `Slowmode restored by ${interaction.user.tag}`
        );

        clearSavedSlowmode(channel.id);

        addModAction(interaction.user.id, {
          type: "Slowmode Restored",
          moderatorId: interaction.user.id,
          reason:
            `Restored #${channel.name} slowmode to ${savedSlowmode} seconds`,
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
            .setTitle("\u{21A9}\u{FE0F} Slowmode Restored")
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
              },
              {
                name: "Restored To",
                value: formatDuration(savedSlowmode),
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

        return interaction.reply({
          content:
            `\u{21A9}\u{FE0F} ${channel} slowmode restored to **${formatDuration(savedSlowmode)}**.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (error) {
      console.error("Slowmode command failed:", error);

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "Failed to change slowmode.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
