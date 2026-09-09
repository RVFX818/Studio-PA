const { MessageFlags, SlashCommandBuilder } = require("discord.js");
const isAdmin = require("../utils/isAdmin");

module.exports = {
  data: new SlashCommandBuilder()
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

  async execute(interaction) {
    if (!(await isAdmin(interaction))) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const amount = interaction.options.getInteger("amount");

    const deleted = await interaction.channel.bulkDelete(
      amount,
      true
    );

    await interaction.reply({
      content: `Deleted ${deleted.size} message(s).`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
