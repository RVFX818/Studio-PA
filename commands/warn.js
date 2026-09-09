const { EmbedBuilder } = require("discord.js");

const isAdmin = require("../utils/isAdmin");

const {
  addWarning,
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
      const reason = interaction.options.getString("reason");

      if (user.bot) {
        return interaction.reply({
          content: "You cannot warn a bot.",
          ephemeral: true,
        });
      }

      if (user.id === interaction.user.id) {
        return interaction.reply({
          content: "You cannot warn yourself.",
          ephemeral: true,
        });
      }

      const result = addWarning(user.id, {
        moderatorId: interaction.user.id,
        reason,
      });

      const logChannel = interaction.guild.channels.cache.get(
        process.env.LOGGING_CHANNEL_ID
      );

      const embed = new EmbedBuilder()
        .setTitle("Member Warned")
        .setThumbnail(
          user.displayAvatarURL({
            size: 256,
          })
        )
        .addFields(
          {
            name: "Member",
            value: `${user}`,
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
          },
          {
            name: "Warning Count",
            value: String(result.count),
            inline: true,
          },
          {
            name: "Warning ID",
            value: result.warning.id,
            inline: true,
          }
        )
        .setFooter({
          text: "Studio PA • Moderation",
        })
        .setTimestamp();

      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({
          embeds: [embed],
        });
      }

      //
      // TRY TO DM MEMBER
      //
      let dmSent = true;

      try {
        await user.send({
          embeds: [
            new EmbedBuilder()
              .setTitle("Warning from Renaissance VFX")
              .setDescription(
                `You received a warning in **${interaction.guild.name}**.`
              )
              .addFields(
                {
                  name: "Reason",
                  value: reason,
                },
                {
                  name: "Total Warnings",
                  value: String(result.count),
                }
              )
              .setFooter({
                text: "Studio PA • Renaissance VFX",
              })
              .setTimestamp(),
          ],
        });
      } catch {
        dmSent = false;
      }

      await interaction.reply({
        content:
          `Warned ${user}. They now have **${result.count} warning(s)**.` +
          (dmSent
            ? ""
            : "\nTheir DMs are closed, so I could not notify them privately."),
        ephemeral: true,
      });
    } catch (error) {
      console.error("Warn command failed:", error);

      if (!interaction.replied) {
        await interaction.reply({
          content: "Failed to warn that member.",
          ephemeral: true,
        });
      }
    }
  },
};
