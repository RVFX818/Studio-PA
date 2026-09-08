const { EmbedBuilder } = require("discord.js");

module.exports = {
  async execute(interaction) {
    try {
      if (!interaction.inGuild()) {
        await interaction.reply({
          content: "This command can only be used inside the server.",
          ephemeral: true,
        });
        return;
      }

      //
      // FETCH MEMBER DIRECTLY FROM DISCORD
      //
      const member = await interaction.guild.members.fetch(
        interaction.user.id
      );

      const adminRoleId = process.env.ADMIN_ROLE_ID;

      console.log("Command used by:", interaction.user.username);
      console.log("Admin role expected:", adminRoleId);
      console.log(
        "User roles:",
        member.roles.cache.map((role) => `${role.name} (${role.id})`)
      );

      //
      // ADMIN ROLE CHECK
      //
      if (!member.roles.cache.has(adminRoleId)) {
        await interaction.reply({
          content: "You do not have permission to use this command.",
          ephemeral: true,
        });
        return;
      }

      const channel = interaction.guild.channels.cache.get(
        process.env.INFO_CHANNEL_ID
      );

      if (!channel || !channel.isTextBased()) {
        await interaction.reply({
          content: "The info channel could not be found.",
          ephemeral: true,
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle("Renaissance VFX")
        .setDescription(
          [
            "## ?? Socials",
            "",
            "[**Official YouTube Channel**](https://youtube.com/@renaissancevfx) - Official videos, trailers, and studio releases",
            "",
            "[**Second YouTube Channel**](https://www.youtube.com/@RVFXStudio) - Extra content, behind-the-scenes videos, experiments, and bonus uploads",
            "",
            "[**Twitch**](https://www.twitch.tv/rvfxstudio) - Live streams",
            "",
            "[**Instagram**](https://www.instagram.com/renaissancevfx/) - Shorts, image posts, and quick updates",
            "",
            "[**TikTok**](https://www.tiktok.com/@renaissance.vfx) - Short-form videos, clips, and studio content",
            "",
            "## ?? Supporter Access",
            "",
            "Join us on **[Patreon](https://patreon.com/RenaissanceVFX)** to unlock exclusive supporter access.",
            "",
            "Already a patron? Join the Discord through Patreon so your account links correctly and your perks unlock automatically.",
            "",
            "## ?? RVFX Studio",
            "",
            "**Interested in joining a production?**",
            "",
            "Explore auditions, open roles, and official project opportunities through **RVFX Studio**.",
            "",
            "**[www.rvfxstudio.com](https://www.rvfxstudio.com)**",
            "",
            "## ?? Renaissance VFX",
            "",
            "Our official services website for cinematic production, VFX, trailers, advertisements, and client collaborations.",
            "",
            "**[www.renaissancevfx.com](https://www.renaissancevfx.com)**",
          ].join("\n")
        )
        .setFooter({
          text: "Studio PA • Renaissance VFX",
        });

      await channel.send({
        embeds: [embed],
      });

      await interaction.reply({
        content: "Info embed posted.",
        ephemeral: true,
      });
    } catch (error) {
      console.error("Failed to post info embed:", error);

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "Failed to post the info embed.",
          ephemeral: true,
        });
      }
    }
  },
};
