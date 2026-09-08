const {
  EmbedBuilder,
  AuditLogEvent,
} = require("discord.js");

module.exports = {
  async execute(member) {
    try {
      if (member.guild.id !== process.env.GUILD_ID) return;

      const channel = member.guild.channels.cache.get(
        process.env.LOGGING_CHANNEL_ID
      );

      if (!channel || !channel.isTextBased()) {
        console.error("Logging channel not found or not text-based.");
        return;
      }

      let action = "Left voluntarily";
      let moderator = "N/A";
      let reason = "No reason provided";

      await new Promise((resolve) => setTimeout(resolve, 1200));

      const kickLogs = await member.guild.fetchAuditLogs({
        type: AuditLogEvent.MemberKick,
        limit: 5,
      });

      const kickEntry = kickLogs.entries.find((entry) => {
        return (
          entry.target?.id === member.user.id &&
          Date.now() - entry.createdTimestamp < 10000
        );
      });

      const banLogs = await member.guild.fetchAuditLogs({
        type: AuditLogEvent.MemberBanAdd,
        limit: 5,
      });

      const banEntry = banLogs.entries.find((entry) => {
        return (
          entry.target?.id === member.user.id &&
          Date.now() - entry.createdTimestamp < 10000
        );
      });

      if (banEntry) {
        action = "Banned";
        moderator = banEntry.executor
          ? `${banEntry.executor}`
          : "Unknown";
        reason = banEntry.reason || "No reason provided";
      } else if (kickEntry) {
        action = "Kicked";
        moderator = kickEntry.executor
          ? `${kickEntry.executor}`
          : "Unknown";
        reason = kickEntry.reason || "No reason provided";
      }

      const roles = member.roles.cache
        .filter((role) => role.id !== member.guild.id)
        .sort((a, b) => b.position - a.position)
        .map((role) => role.name);

      const joinedTimestamp = member.joinedTimestamp;

      let timeInServer = "Unknown";

      if (joinedTimestamp) {
        const diff = Date.now() - joinedTimestamp;

        const days = Math.floor(diff / 86400000);
        const hours = Math.floor(
          (diff % 86400000) / 3600000
        );
        const minutes = Math.floor(
          (diff % 3600000) / 60000
        );

        if (days > 0) {
          timeInServer =
            `${days} day${days === 1 ? "" : "s"}, ` +
            `${hours} hour${hours === 1 ? "" : "s"}`;
        } else if (hours > 0) {
          timeInServer =
            `${hours} hour${hours === 1 ? "" : "s"}, ` +
            `${minutes} minute${minutes === 1 ? "" : "s"}`;
        } else {
          timeInServer =
            `${minutes} minute${minutes === 1 ? "" : "s"}`;
        }
      }

      const embed = new EmbedBuilder()
        .setTitle(`Member ${action}`)
        .setThumbnail(
          member.user.displayAvatarURL({
            size: 256,
          })
        )
        .addFields(
          {
            name: "User",
            value: `${member.user}`,
            inline: true,
          },
          {
            name: "Display Name",
            value:
              member.displayName ||
              member.user.username,
            inline: true,
          },
          {
            name: "User ID",
            value: member.user.id,
            inline: false,
          },
          {
            name: "Action",
            value: action,
            inline: true,
          },
          {
            name: "Moderator",
            value: moderator,
            inline: true,
          },
          {
            name: "Reason",
            value: reason.slice(0, 1024),
            inline: false,
          },
          {
            name: "Joined Server",
            value: joinedTimestamp
              ? `<t:${Math.floor(joinedTimestamp / 1000)}:F>`
              : "Unknown",
            inline: false,
          },
          {
            name: "Time in Server",
            value: timeInServer,
            inline: true,
          },
          {
            name: "Account Created",
            value: `<t:${Math.floor(
              member.user.createdTimestamp / 1000
            )}:F>`,
            inline: false,
          },
          {
            name: "Bot",
            value: member.user.bot ? "Yes" : "No",
            inline: true,
          },
          {
            name: "Roles",
            value:
              roles.length > 0
                ? roles
                    .map((role) => `\`${role}\``)
                    .join(", ")
                    .slice(0, 1024)
                : "None",
            inline: false,
          }
        )
        .setFooter({
          text: "Studio PA • Member log",
        })
        .setTimestamp();

      await channel.send({
        embeds: [embed],
      });

      console.log(`${member.user.tag}: ${action}`);
    } catch (error) {
      console.error("Failed to send member log:", error);
    }
  },
};
