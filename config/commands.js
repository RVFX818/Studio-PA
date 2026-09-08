const { SlashCommandBuilder } = require("discord.js");

module.exports = [
  new SlashCommandBuilder()
    .setName("post-info")
    .setDescription("Post the Renaissance VFX info embed"),
].map((command) => command.toJSON());
