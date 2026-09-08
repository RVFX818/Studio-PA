const postInfo = require("../commands/postInfo");

module.exports = {
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "post-info") {
      await postInfo.execute(interaction);
    }
  },
};
