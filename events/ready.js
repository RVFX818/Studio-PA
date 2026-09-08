const {
  REST,
  Routes,
} = require("discord.js");

const commands = require("../config/commands");

module.exports = {
  async execute(readyClient) {
    console.log(`Studio PA is online as ${readyClient.user.tag}`);

    try {
      const rest = new REST({ version: "10" }).setToken(
        process.env.DISCORD_TOKEN
      );

      await rest.put(
        Routes.applicationGuildCommands(
          readyClient.user.id,
          process.env.GUILD_ID
        ),
        { body: commands }
      );

      console.log("Slash commands registered.");
    } catch (error) {
      console.error("Failed to register slash commands:", error);
    }
  },
};
