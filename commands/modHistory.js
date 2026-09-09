const { EmbedBuilder } = require("discord.js");
const isAdmin = require("../utils/isAdmin");

const {
  getUserRecord,
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
      const record = getUserRecord(user.id);

      const warnings = record.warnings || [];
      const autoModOffenses = record.autoModOffenses || [];
      const messageProtectionOffenses =
        record.messageProtectionOffenses || [];
      const modActions = record.modActions || [];

      let recentWarnings = "None";
      let recentAutoMod = "None";
      let recentMessageProtection = "None";
      let recentActions = "None";

      if (warnings.length > 0) {
        recentWarnings = warnings
          .slice(-5)
          .reverse()
          .map((warning) => {
            const timestamp = Math.floor(
              warning.timestamp / 1000
            );

            return (
              `• **${warning.reason}**\n` +
              `  Moderator: <@${warning.moderatorId}> • ` +
              `<t:${timestamp}:R>\n` +
              `  ID: \`${warning.id}\``
            );
          })
          .join("\n\n");
      }

      if (autoModOffenses.length > 0) {
        recentAutoMod = autoModOffenses
          .slice(-5)
          .reverse()
          .map((offense) => {
            const timestamp = Math.floor(
              offense.timestamp / 1000
            );

            return (
              `• **${offense.ruleName || "Unknown Rule"}**\n` +
              `  Channel: ${
                offense.channelId
                  ? `<#${offense.channelId}>`
                  : "Unknown"
              }\n` +
              `  Keyword: ${
                offense.matchedKeyword || "Not provided"
              }\n` +
              `  <t:${timestamp}:R>`
            );
          })
          .join("\n\n");
      }

      if (messageProtectionOffenses.length > 0) {
        recentMessageProtection =
          messageProtectionOffenses
            .slice(-5)
            .reverse()
            .map((offense) => {
              const timestamp = Math.floor(
                offense.timestamp / 1000
              );

              return (
                `• **${offense.type || "Unknown Violation"}**\n` +
                `  Channel: ${
                  offense.channelId
                    ? `<#${offense.channelId}>`
                    : "Unknown"
                }\n` +
                `  Message: ${
                  offense.content
                    ? `\`${offense.content.slice(0, 120)}\``
                    : "Not stored"
                }\n` +
                `  <t:${timestamp}:R>`
              );
            })
            .join("\n\n");
      }

      if (modActions.length > 0) {
        recentActions = modActions
          .slice(-8)
          .reverse()
          .map((action) => {
            const timestamp = Math.floor(
              action.timestamp / 1000
            );

            let durationText = "";

            if (
              typeof action.durationMinutes === "number" &&
              action.durationMinutes > 0
            ) {
              durationText =
                `\n  Duration: ${action.durationMinutes} minute(s)`;
            }

            return (
              `• **${action.type}**` +
              `${durationText}\n` +
              `  Moderator: ${
                action.moderatorId
                  ? `<@${action.moderatorId}>`
                  : "Automatic"
              }\n` +
              `  Reason: ${
                action.reason || "No reason provided"
              }\n` +
              `  Source: ${
                action.source || "Unknown"
              } • <t:${timestamp}:R>`
            );
          })
          .join("\n\n");
      }

      const embed = new EmbedBuilder()
        .setTitle("Moderation History")
        .setThumbnail(
          user.displayAvatarURL({
            size: 256,
          })
        )
        .setDescription(`${user}`)
        .addFields(
          {
            name: "Manual Warnings",
            value: String(warnings.length),
            inline: true,
          },
          {
            name: "Discord AutoMod",
            value: String(autoModOffenses.length),
            inline: true,
          },
          {
            name: "Message Protection",
            value: String(messageProtectionOffenses.length),
            inline: true,
          },
          {
            name: "Moderation Actions",
            value: String(modActions.length),
            inline: true,
          },
          {
            name: "Recent Manual Warnings",
            value: recentWarnings.slice(0, 1024),
            inline: false,
          },
          {
            name: "Recent Discord AutoMod Offenses",
            value: recentAutoMod.slice(0, 1024),
            inline: false,
          },
          {
            name: "Recent Message Protection Offenses",
            value: recentMessageProtection.slice(0, 1024),
            inline: false,
          },
          {
            name: "Recent Moderation Actions",
            value: recentActions.slice(0, 1024),
            inline: false,
          }
        )
        .setFooter({
          text: "Studio PA • Moderation History",
        })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    } catch (error) {
      console.error("Mod-history command failed:", error);

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "Failed to load moderation history.",
          ephemeral: true,
        });
      }
    }
  },
};
