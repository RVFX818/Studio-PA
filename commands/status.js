const fs = require("fs");
const path = require("path");
const { EmbedBuilder, MessageFlags, SlashCommandBuilder } = require("discord.js");

const isAdmin = require("../utils/isAdmin");

function formatUptime(ms) {
  const totalSeconds = Math.floor(ms / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(" ");
}

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("View Studio PA system status"),

  async execute(interaction) {
    try {
      if (!(await isAdmin(interaction))) {
        return interaction.reply({
          content: "You do not have permission to use this command.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const client = interaction.client;

      const memory = process.memoryUsage();

      const dataPath = path.join(
        __dirname,
        "..",
        "data",
        "moderation.json"
      );

      const moderationDataExists = fs.existsSync(dataPath);

      let moderationDataSize = "Not found";

      if (moderationDataExists) {
        const stats = fs.statSync(dataPath);
        moderationDataSize = formatBytes(stats.size);
      }

      const embed = new EmbedBuilder()
        .setTitle("Studio PA Status")
        .addFields(
          {
            name: "Status",
            value: "Online",
            inline: true,
          },
          {
            name: "Uptime",
            value: formatUptime(client.uptime || 0),
            inline: true,
          },
          {
            name: "Discord Ping",
            value: `${client.ws.ping} ms`,
            inline: true,
          },
          {
            name: "Memory Usage",
            value: formatBytes(memory.rss),
            inline: true,
          },
          {
            name: "Node.js",
            value: process.version,
            inline: true,
          },
          {
            name: "Process ID",
            value: String(process.pid),
            inline: true,
          },
          {
            name: "Server",
            value: interaction.guild.name,
            inline: true,
          },
          {
            name: "Moderation Data",
            value: moderationDataExists
              ? `Available � ${moderationDataSize}`
              : "Missing",
            inline: true,
          }
        )
        .setFooter({
          text: "Studio PA � System Status",
        })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Status command failed:", error);

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "Failed to load Studio PA status.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
