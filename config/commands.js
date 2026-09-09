const { SlashCommandBuilder } = require("discord.js");

module.exports = [
  new SlashCommandBuilder()
    .setName("post-info")
    .setDescription("Post the Renaissance VFX info embed"),

  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a member")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member to timeout")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("minutes")
        .setDescription("Timeout duration in minutes")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the timeout")
        .setRequired(false)
        .setMaxLength(500)
    ),

  new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("Remove a member timeout")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member to remove timeout from")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for removing the timeout")
        .setRequired(false)
        .setMaxLength(500)
    ),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member to kick")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the kick")
        .setRequired(false)
        .setMaxLength(500)
    ),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member to ban")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the ban")
        .setRequired(false)
        .setMaxLength(500)
    ),

  new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Delete recent messages")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of messages to delete")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a member")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member to warn")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the warning")
        .setRequired(true)
        .setMaxLength(500)
    ),

  new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("View a member's warning history")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member to view")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("remove-warning")
    .setDescription("Remove one warning from a member")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member whose warning should be removed")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("warning-id")
        .setDescription("Warning ID to remove")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("clear-warnings")
    .setDescription("Clear all manual warnings from a member")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member whose warnings should be cleared")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("mod-history")
    .setDescription("View a member's full moderation history")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member to view")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("status")
    .setDescription("View Studio PA system status"),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("View Studio PA admin commands"),
].map((command) => command.toJSON());
