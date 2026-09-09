const isAdmin = require("../utils/isAdmin");

module.exports = {
  async execute(interaction) {
    if (!(await isAdmin(interaction))) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }

    const amount = interaction.options.getInteger("amount");

    const deleted = await interaction.channel.bulkDelete(
      amount,
      true
    );

    await interaction.reply({
      content: `Deleted ${deleted.size} message(s).`,
      ephemeral: true,
    });
  },
};
