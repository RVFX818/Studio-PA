const { EmbedBuilder } = require("discord.js");

const {
  config,
} = require("../config/studioConfig");

const joins = [];

const RAID_WINDOW_MS =
  config.moderation.raidProtection.windowMs;
const RAID_THRESHOLD =
  config.moderation.raidProtection.joinThreshold;

const ONE_DAY_MS =
  config.moderation.newAccountRisk.highRiskAgeMs;
const SEVEN_DAYS_MS =
  config.moderation.newAccountRisk.cautionAgeMs;

module.exports = {
  async execute(member) {
    try {
      if (member.guild.id !== process.env.GUILD_ID) return;

      const now = Date.now();

      //
      // ACCOUNT AGE CHECK
      //
      const accountAgeMs =
        now - member.user.createdTimestamp;

      let riskLevel = null;
      let riskLabel = null;

      if (accountAgeMs < ONE_DAY_MS) {
        riskLevel = "HIGH";
        riskLabel = "Account created less than 24 hours ago";
      } else if (accountAgeMs < SEVEN_DAYS_MS) {
        riskLevel = "CAUTION";
        riskLabel = "Account created less than 7 days ago";
      }

      if (riskLevel) {
        const logChannel =
          member.guild.channels.cache.get(
            process.env.LOGGING_CHANNEL_ID
          );

        if (
          logChannel &&
          logChannel.isTextBased()
        ) {
          const accountCreatedTimestamp =
            Math.floor(
              member.user.createdTimestamp / 1000
            );

          const embed = new EmbedBuilder()
            .setTitle("New Account Risk Alert")
            .setThumbnail(
              member.user.displayAvatarURL({
                size: 256,
              })
            )
            .addFields(
              {
                name: "Member",
                value: `${member.user}`,
                inline: true,
              },
              {
                name: "User ID",
                value: member.user.id,
                inline: true,
              },
              {
                name: "Risk Level",
                value: riskLevel,
                inline: true,
              },
              {
                name: "Reason",
                value: riskLabel,
                inline: false,
              },
              {
                name: "Account Created",
                value:
                  `<t:${accountCreatedTimestamp}:F>\n` +
                  `<t:${accountCreatedTimestamp}:R>`,
                inline: false,
              }
            )
            .setFooter({
              text:
                "Studio PA � Join Protection",
            })
            .setTimestamp();

          await logChannel.send({
            embeds: [embed],
          });
        }
      }

      //
      // RAID DETECTION
      //
      joins.push({
        userId: member.user.id,
        timestamp: now,
      });

      while (
        joins.length > 0 &&
        now - joins[0].timestamp > RAID_WINDOW_MS
      ) {
        joins.shift();
      }

      if (joins.length < RAID_THRESHOLD) return;

      const logChannel =
        member.guild.channels.cache.get(
          process.env.LOGGING_CHANNEL_ID
        );

      if (
        !logChannel ||
        !logChannel.isTextBased()
      ) {
        return;
      }

      const recentUsers = joins
        .slice(-RAID_THRESHOLD)
        .map((join) => `<@${join.userId}>`)
        .join("\n");

      const raidEmbed = new EmbedBuilder()
        .setTitle("Possible Raid Detected")
        .setDescription(
          `${joins.length} members joined within the last minute.`
        )
        .addFields(
          {
            name: "Threshold",
            value:
              `${RAID_THRESHOLD} joins / 60 seconds`,
            inline: true,
          },
          {
            name: "Recent Members",
            value:
              recentUsers.slice(0, 1024),
            inline: false,
          }
        )
        .setFooter({
          text:
            "Studio PA � Raid Protection",
        })
        .setTimestamp();

      await logChannel.send({
        content:
          `<@&${process.env.ADMIN_ROLE_ID}>`,
        embeds: [raidEmbed],
        allowedMentions: {
          roles: [
            process.env.ADMIN_ROLE_ID,
          ],
        },
      });

      console.log(
        `Possible raid detected: ${joins.length} joins in 60 seconds`
      );

      //
      // RESET AFTER ALERT
      //
      joins.length = 0;
    } catch (error) {
      console.error(
        "Join protection failed:",
        error
      );
    }
  },
};
