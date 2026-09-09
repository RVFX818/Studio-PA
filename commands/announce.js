const {
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ChannelType,
} = require("discord.js");

const isAdmin = require("../utils/isAdmin");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Post an RVFX announcement")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel to post the announcement in")
        .addChannelTypes(
          ChannelType.GuildText,
          ChannelType.GuildAnnouncement
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Announcement title")
        .setRequired(true)
        .setMaxLength(256)
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Announcement message")
        .setRequired(true)
        .setMaxLength(4000)
    )
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("Optional role to notify, including @everyone")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("image")
        .setDescription("Optional image URL")
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      if (!(await isAdmin(interaction))) {
        return interaction.reply({
          content: "You do not have permission to use this command.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const channel =
        interaction.options.getChannel("channel", true);

      const title =
        interaction.options.getString("title", true);

      const message =
        interaction.options.getString("message", true);

      const role =
        interaction.options.getRole("role", false);

      const image =
        interaction.options.getString("image", false);

      if (!channel.isTextBased()) {
        return interaction.reply({
          content: "Announcements can only be posted in text-based channels.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const botMember = interaction.guild.members.me;

      const permissions =
        channel.permissionsFor(botMember);

      if (
        !permissions ||
        !permissions.has(PermissionFlagsBits.ViewChannel) ||
        !permissions.has(PermissionFlagsBits.SendMessages) ||
        !permissions.has(PermissionFlagsBits.EmbedLinks)
      ) {
        return interaction.reply({
          content:
            "Studio PA does not have permission to post embeds in that channel.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const isEveryone =
        role &&
        role.id === interaction.guild.roles.everyone.id;

      if (
        isEveryone &&
        !permissions.has(PermissionFlagsBits.MentionEveryone)
      ) {
        return interaction.reply({
          content:
            "Studio PA does not have permission to mention @everyone in that channel.",
          flags: MessageFlags.Ephemeral,
        });
      }

      if (image) {
        try {
          const parsedUrl = new URL(image);

          if (
            parsedUrl.protocol !== "http:" &&
            parsedUrl.protocol !== "https:"
          ) {
            throw new Error("Invalid protocol");
          }
        } catch {
          return interaction.reply({
            content:
              "The image must be a valid http:// or https:// URL.",
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(message)
        .setFooter({
          text: "RVFX Studio � Renaissance VFX",
        })
        .setTimestamp();

      if (image) {
        embed.setImage(image);
      }

      const announcementPayload = {
        embeds: [embed],
        allowedMentions: {
          parse: isEveryone ? ["everyone"] : [],
          roles:
            role && !isEveryone
              ? [role.id]
              : [],
        },
      };

      if (role) {
        announcementPayload.content =
          isEveryone
            ? "@everyone"
            : `${role}`;
      }

      const sentMessage =
        await channel.send(announcementPayload);

      const logChannel =
        await interaction.guild.channels.fetch(
          process.env.LOGGING_CHANNEL_ID
        );

      if (
        logChannel &&
        logChannel.isTextBased()
      ) {
        const logEmbed = new EmbedBuilder()
          .setTitle("\u{1F4E2} Announcement Posted")
          .addFields(
            {
              name: "Channel",
              value: `${channel}`,
              inline: true,
            },
            {
              name: "Posted By",
              value: `${interaction.user}`,
              inline: true,
            },
            {
              name: "Role Ping",
              value: role ? `${role}` : "None",
              inline: true,
            },
            {
              name: "Title",
              value: title,
              inline: false,
            }
          )
          .setFooter({
            text: "Studio PA � Administration",
          })
          .setTimestamp();

        await logChannel.send({
          embeds: [logEmbed],
          allowedMentions: {
            parse: [],
          },
        });
      }

      await interaction.reply({
        content:
          `\u{2705} Announcement posted in ${channel}.\n${sentMessage.url}`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Announce command failed:", error);

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "Failed to post the announcement.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
